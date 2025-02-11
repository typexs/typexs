import { Body, CurrentUser, Delete, Get, HttpError, JsonController, Param, Post, Put, QueryParam } from 'routing-controllers';
import {
  __CLASS__,
  __REGISTRY__,
  Cache,
  ClassLoader,
  IAggregateOptions,
  ICollection,
  IDeleteOptions,
  IEntityController,
  IFindOptions,
  IMessage,
  Inject,
  Invoker,
  IRequestOptions,
  ISaveOptions,
  IStorageRef,
  IUpdateOptions,
  Log,
  NotYetImplementedError,
  Storage,
  XS_P_$COUNT,
  XS_P_$LIMIT,
  XS_P_$OFFSET
} from '@typexs/base';
import { Access, C_API, ContextGroup, HttpResponseError, SystemNodeInfoApi, WalkValues, XS_P_$LABEL, XS_P_$URL } from '@typexs/server';
import {
  _API_CTRL_STORAGE_AGGREGATE_ENTITY,
  _API_CTRL_STORAGE_DELETE_ENTITIES_BY_CONDITION,
  _API_CTRL_STORAGE_DELETE_ENTITY,
  _API_CTRL_STORAGE_FIND_ENTITY,
  _API_CTRL_STORAGE_GET_ENTITY,
  _API_CTRL_STORAGE_METADATA_ALL_ENTITIES,
  _API_CTRL_STORAGE_METADATA_ALL_STORES,
  _API_CTRL_STORAGE_METADATA_CREATE_ENTITY,
  _API_CTRL_STORAGE_METADATA_GET_ENTITY,
  _API_CTRL_STORAGE_METADATA_GET_STORE,
  _API_CTRL_STORAGE_SAVE_ENTITY,
  _API_CTRL_STORAGE_UPDATE_ENTITIES_BY_CONDITION,
  _API_CTRL_STORAGE_UPDATE_ENTITY,
  API_CTRL_STORAGE_GET_ENTITY,
  API_CTRL_STORAGE_PREFIX,
  PERMISSION_ALLOW_ACCESS_STORAGE_ENTITY,
  PERMISSION_ALLOW_ACCESS_STORAGE_ENTITY_PATTERN,
  PERMISSION_ALLOW_ACCESS_STORAGE_METADATA,
  PERMISSION_ALLOW_DELETE_STORAGE_ENTITY,
  PERMISSION_ALLOW_DELETE_STORAGE_ENTITY_PATTERN,
  PERMISSION_ALLOW_SAVE_STORAGE_ENTITY,
  PERMISSION_ALLOW_SAVE_STORAGE_ENTITY_PATTERN,
  PERMISSION_ALLOW_UPDATE_STORAGE_ENTITY,
  PERMISSION_ALLOW_UPDATE_STORAGE_ENTITY_PATTERN
} from '../lib/Constants';
import { IBuildOptions, IEntityRef, IJsonSchema7, IPropertyRef, JsonSchema, METATYPE_PROPERTY, T_STRING } from '@allgemein/schema-api';
import { Expressions } from '@allgemein/expressions';
import { IStorageRefMetadata } from '../lib/storage_api/IStorageRefMetadata';
import { StorageAPIControllerApi } from '../api/StorageAPIController.api';
import { JsonUtils, TreeUtils } from '@allgemein/base';
import { IRolesHolder, PermissionHelper } from '@typexs/roles-api';
import { isEntityRef } from '@allgemein/schema-api/api/IEntityRef';
import { assign, cloneDeep, concat, get, isArray, isEmpty, isFunction, isNumber, isPlainObject, isString, keys, uniq } from 'lodash';

@ContextGroup(C_API)
@JsonController(API_CTRL_STORAGE_PREFIX)
export class StorageAPIController {

  @Inject(Storage.NAME)
  storage: Storage;

  @Inject(Invoker.NAME)
  invoker: Invoker;

  @Inject(Cache.NAME)
  cache: Cache;


  static _beforeBuild(entityRef: IEntityRef, from: any, to: any) {
     Object.keys(from).filter(k => k.startsWith('$')).map(k => {
      to[k] = from[k];
    });
  }


  static _afterEntity(entityRef: IEntityRef | IEntityRef[], entity: any[]): void {
    if (isArray(entityRef)) {
      entity.forEach(e => {
        const _entityRef = entityRef.find(x => x.isOf(e));
        if (_entityRef) {
          const props = _entityRef.getPropertyRefs().filter(id => id.isIdentifier());
          this.addMeta(_entityRef, e, props);
        } else {
          this.addMetaError(e);
        }
      });
    } else if (entityRef) {
      const props = entityRef.getPropertyRefs().filter(id => id.isIdentifier());
      entity.forEach(e => {
        this.addMeta(entityRef, e, props);
      });
    } else {
      entity.forEach(e => {
        this.addMetaError(e);
      });

    }
  }


  static addMetaError(e: any) {
    this.addMessage(e, { type: 'error', topic: 'entity_ref_not_found', content: 'EntityRef for this object can\'t be found.' });
  }


  static addMessage(e: any, msg: IMessage) {
    if (!e['$message'] || !isArray(e['$message'])) {
      e['$message'] = [];
    }
    e['$message'].push(msg);
  }

  private static addMeta(entityRef: IEntityRef, e: any, props: IPropertyRef[]) {
    const idStr = Expressions.buildLookupConditions(entityRef, e);
    e[XS_P_$URL] = `${API_CTRL_STORAGE_GET_ENTITY}`.replace(':name', entityRef.machineName).replace(':id', idStr);
    e[XS_P_$LABEL] = isFunction(e.label) ? e.label() : props.map(p => p.get(e)).join(' ');
    if (!e[__CLASS__]) {
      e[__CLASS__] = entityRef.name;
    }
    if (!e[__REGISTRY__]) {
      e[__REGISTRY__] = entityRef.getNamespace();
    }
  }

  static checkOptions(opts: any, options: any) {
    if (!isEmpty(opts)) {
      // const checked = {};
      //  Object.keys(opts).filter(k => [
      //     'raw',
      //     'timeout',
      //     'validate',
      //     'noTransaction',
      //     'skipBuild'].indexOf(k) > -1 &&
      //   (isString(opts[k]) || isNumber(opts[k]) || isBoolean(opts[k])))
      //   .map(k => checked[k] = opts[k]);
      assign(options, opts);
    }
  }


  /**
   * Return list of schemas with their entities
   */
  // @Authorized('read metadata schema')
  // - Check if user has an explicit credential to access the method
  @Access(PERMISSION_ALLOW_ACCESS_STORAGE_METADATA)
  @Get(_API_CTRL_STORAGE_METADATA_ALL_STORES)
  async getMetadatas(@CurrentUser() user: any): Promise<any> {
    const storageNames = this.storage.getNames();
    const data = await Promise.all(storageNames.map(storageName => this.getStorageSchema(storageName)));
    return data;
  }


  /**
   * Return list of entity
   */
  @Access(PERMISSION_ALLOW_ACCESS_STORAGE_METADATA)
  @Get(_API_CTRL_STORAGE_METADATA_GET_STORE)
  async getMetadata(@Param('name') storageName: string,
    @QueryParam('withCollections') withCollections: boolean,
    @QueryParam('refresh') refresh: boolean,
    @CurrentUser() user: any) {
    return this.getStorageSchema(storageName, withCollections, refresh);
  }


  /**
   * Return list of defined entities
   */
  @Access(PERMISSION_ALLOW_ACCESS_STORAGE_METADATA)
  @Get(_API_CTRL_STORAGE_METADATA_ALL_ENTITIES)
  async getMetadataEntities(@CurrentUser() user: any) {
    const storageNames = this.storage.getNames();
    let data: IJsonSchema7[] = [];
    const arrs = await Promise.all(storageNames.map(storageName => this.getStorageSchema(storageName).then(e => e.schema)));
    data = concat([], ...arrs);
    return data;
  }


  /**
   * Return list of defined entities
   */
  @Access(PERMISSION_ALLOW_ACCESS_STORAGE_METADATA)
  @Get(_API_CTRL_STORAGE_METADATA_GET_ENTITY)
  async getMetadataEntity(@Param('name') entityName: string, @QueryParam('opts') opts: IRequestOptions = {}, @CurrentUser() user: any) {
    const ref = this.getStorageRef(entityName, opts?.storage);
    const entityRef = this.getEntityRef(ref, entityName) as IEntityRef;
    if (isArray(entityRef)) {
      throw new Error('multiple entity refs found');
    }

    const entry = this.getSerializer({ storage: ref.getName() }).serialize(entityRef);
    return entry;
  }


  /**
   * TODO
   */
  @Access(PERMISSION_ALLOW_ACCESS_STORAGE_METADATA)
  @Post(_API_CTRL_STORAGE_METADATA_CREATE_ENTITY)
  async entityCreate(@Body() data: any, @CurrentUser() user: any) {
    throw new NotYetImplementedError();
  }

  /**
   * Run a query for entity or an aggregation
   */
  @Access([
    PERMISSION_ALLOW_ACCESS_STORAGE_ENTITY,
    PERMISSION_ALLOW_ACCESS_STORAGE_ENTITY_PATTERN])
  @Get(_API_CTRL_STORAGE_FIND_ENTITY)
  query(@Param('name') name: string,
    @QueryParam('query') query: string,
    @QueryParam('sort') sort: string = null,
    @QueryParam('limit') limit: number = 50,
    @QueryParam('offset') offset: number = 0,
    @QueryParam('opts') opts: IFindOptions = {},
    @CurrentUser() user: any) {
    return this._query(name, query, null, sort, limit, offset, opts, user);
  }

  /**
   * Run a query for entity or an aggregation
   */
  @Access([
    PERMISSION_ALLOW_ACCESS_STORAGE_ENTITY,
    PERMISSION_ALLOW_ACCESS_STORAGE_ENTITY_PATTERN])
  @Get(_API_CTRL_STORAGE_AGGREGATE_ENTITY)
  aggregate(@Param('name') name: string,
    @QueryParam('aggr') aggr: string,
    @QueryParam('sort') sort: string = null,
    @QueryParam('limit') limit: number = 50,
    @QueryParam('offset') offset: number = 0,
    @QueryParam('opts') opts: IFindOptions = {},
    @CurrentUser() user: any) {
    return this._query(name, null, aggr, sort, limit, offset, opts, user);
  }

  /**
   * Run a query for entity or an aggregation
   */
  private async _query(
    name: string,
    query: string,
    aggr: string,
    sort: string = null,
    limit: number = 50,
    offset: number = 0,
    opts: IFindOptions = {},
    user: IRolesHolder
  ) {
    const { ref, controller } = this.getControllerForEntityName(name, opts?.storage, user);

    if (!isNumber(limit)) {
      limit = 50;
    }

    if (!isNumber(offset)) {
      offset = 0;
    }

    const aggregationMode = !!aggr && !isEmpty(aggr);

    let conditions: any = aggregationMode ? aggr : query;
    if (conditions) {
      conditions = JsonUtils.parse(conditions);
      if (
        !isPlainObject(conditions) &&
        !isArray(conditions)
      ) {
        throw new Error('conditions are wrong ' + conditions);
      }
    }

    let sortBy = null;
    if (sort) {
      sortBy = JsonUtils.parse(sort);
      if (!isPlainObject(sortBy)) {
        throw new Error('sort by is wrong ' + sort);
      }
    }

    let result: any = null;
    if (aggr && !isEmpty(aggr)) {
      const options: IAggregateOptions = {
        limit: limit,
        offset: offset,
        sort: sortBy
      };
      StorageAPIController.checkOptions(opts, options);

      result = await controller.aggregate(
        (isArray(ref) ? ref.map(r => r.getClassRef().getClass()) : ref.getClassRef().getClass()) as any,
        conditions,
        options);
    } else {
      const options: IFindOptions = {
        limit: limit,
        offset: offset,
        sort: sortBy
        // hooks: {afterEntity: StorageAPIController._afterEntity}
      };
      StorageAPIController.checkOptions(opts, options);

      result = await controller.find(
        (isArray(ref) ? ref.map(r => r.getClassRef().getClass()) : ref.getClassRef().getClass()) as any,
        conditions,
        options);
      if (!isEmpty(result)) {
        StorageAPIController._afterEntity(ref, result);
      }
    }

    const results = {
      entities: result,
      $count: result[XS_P_$COUNT],
      $limit: result[XS_P_$LIMIT],
      $offset: result[XS_P_$OFFSET]
    };

    // pass $dollared key
     Object.keys(result).filter(x => isString(x) && /^\$/.test(x)).forEach(k => {
      results[k] = result[k];
    });

    // TODO Facets support

    try {
      this.invoker.use(StorageAPIControllerApi)
        .postProcessResults('query', ref, results, {
          name: name,
          query: query,
          aggr: aggr,
          sort: sort,
          limit: limit,
          opts: opts,
          user: user,
          aggregation: aggregationMode
        });
    } catch (e) {
      throw new HttpResponseError(['storage', 'query'], e.message);
    }

    return results;
  }


  /**
   * Return a single Entity
   */
  @Access([
    PERMISSION_ALLOW_ACCESS_STORAGE_ENTITY,
    PERMISSION_ALLOW_ACCESS_STORAGE_ENTITY_PATTERN])
  @Get(_API_CTRL_STORAGE_GET_ENTITY)
  async get(@Param('name') name: string,
    @Param('id') id: string,
    @QueryParam('opts') opts: IFindOptions = {},
    @CurrentUser() user: any) {
    if (isEmpty(name) || isEmpty(id)) {
      throw new HttpError(400, 'entity name or id not set');
    }

    const { ref, controller } = this.getControllerForEntityName(name, opts?.storage);
    if (isArray(ref)) {
      throw new Error('multiple entity ref are not supported for "get"');
    }

    const options: IFindOptions = {
      limit: 0
    };

    StorageAPIController.checkOptions(opts, options);
    let conditions = controller.entityIdQuery ? controller.entityIdQuery(ref, id) : Expressions.parseLookupConditions(ref, id);
    let result = null;
    if (isArray(conditions)) {
      if (conditions.length > 1) {
        // multiple ids should be bound by 'or', else it would be 'and'
        conditions = { $or: conditions };
      }
      result = await controller.find(ref.getClassRef().getClass(), conditions, options);
      StorageAPIController._afterEntity(ref, result);
      const results = {
        entities: result,
        $count: result[XS_P_$COUNT],
        $limit: result[XS_P_$LIMIT],
        $offset: result[XS_P_$OFFSET]
      };
      result = results;
    } else {
      options.limit = 1;
      result = await controller.find(ref.getClassRef().getClass(), conditions, options);
      StorageAPIController._afterEntity(ref, result);
      result = result.shift();
    }

    try {
      this.invoker.use(StorageAPIControllerApi).postProcessResults('get', ref, result, {
        name: name,
        id: id,
        opts: opts,
        user: user
      });
    } catch (e) {
      throw new HttpResponseError(['storage', 'get'], e.message);
    }
    return result;

  }


  /**
   * Return a new created Entity or executes an update
   */
  @Access([PERMISSION_ALLOW_SAVE_STORAGE_ENTITY, PERMISSION_ALLOW_SAVE_STORAGE_ENTITY_PATTERN])
  @Post(_API_CTRL_STORAGE_SAVE_ENTITY)
  async save(@Param('name') name: string,
    @Body() data: any,
    @QueryParam('opts') opts: ISaveOptions | IUpdateOptions = {},
    @CurrentUser() user: any): Promise<any> {
    const { ref, controller } = this.getControllerForEntityName(name, opts?.storage);
    if (isArray(ref)) {
      throw new Error('multiple entity ref are not supported for "save"');
    }
    const options: ISaveOptions = { validate: true };
    StorageAPIController.checkOptions(opts, options);

    const entities = this.prepareEntities(ref, data, options);
    try {
      const results = await controller.save(entities, options);
      this.invoker.use(StorageAPIControllerApi).postProcessResults('save', ref, results, {
        name: name,
        opts: opts,
        user: user
      });
      return results;
    } catch (e) {
      throw new HttpResponseError(['storage', 'save'], e.message);
    }
  }


  /**
   * Return a updated Entity
   */
  @Access([PERMISSION_ALLOW_UPDATE_STORAGE_ENTITY, PERMISSION_ALLOW_UPDATE_STORAGE_ENTITY_PATTERN])
  @Post(_API_CTRL_STORAGE_UPDATE_ENTITY)
  async updateById(@Param('name') name: string,
    @Param('id') id: string,
    @QueryParam('opts') opts: IUpdateOptions = {},
    @Body() data: any,
    @CurrentUser() user: any) {

    const { ref, controller } = this.getControllerForEntityName(name, opts?.storage);
    if (isArray(ref)) {
      throw new Error('multiple entity ref are not supported for "update"');
    }

    const options: ISaveOptions = { validate: true };
    StorageAPIController.checkOptions(opts, options);
    const entities = this.prepareEntities(ref, data, options);

    try {
      const results = await controller.save(entities, options);
      this.invoker.use(StorageAPIControllerApi)
        .postProcessResults('update', ref, results, {
          name: name,
          id: id,
          opts: opts,
          user: user
        });
      return results;
    } catch (e) {
      throw new HttpResponseError(['storage', 'update'], e.message);
    }
  }

  /**
   * Mas update of data by given query
   */
  @Access([
    PERMISSION_ALLOW_UPDATE_STORAGE_ENTITY,
    PERMISSION_ALLOW_UPDATE_STORAGE_ENTITY_PATTERN])
  @Put(_API_CTRL_STORAGE_UPDATE_ENTITIES_BY_CONDITION)
  async updateByCondition(@Param('name') name: string,
    @QueryParam('query') query: any = null,
    @QueryParam('opts') opts: IUpdateOptions = {},
    @Body() data: any,
    @CurrentUser() user: any) {
    if (!data) {
      throw new HttpResponseError(['storage', 'update'], 'No update data given');
    }

    if (!query) {
      // select all for change
      query = {};
    }

    const { ref, controller } = this.getControllerForEntityName(name, opts?.storage);
    if (isArray(ref)) {
      throw new Error('multiple entity ref are not supported for "update"');
    }

    const options: IUpdateOptions = { validate: true };
    StorageAPIController.checkOptions(opts, options);

    try {
      const results = await controller.update(
        ref.getClassRef().getClass(),
        query,
        data,
        options
      );
      this.invoker.use(StorageAPIControllerApi)
        .postProcessResults('update', ref, results, {
          name: name,
          query: query,
          update: data,
          opts: opts,
          user: user
        });
      return results;
    } catch (e) {
      throw new HttpResponseError(['storage', 'update'], e.message);
    }

  }


  /**
   * Deletes a entity and return removal results
   *
   */
  @Access([PERMISSION_ALLOW_DELETE_STORAGE_ENTITY, PERMISSION_ALLOW_DELETE_STORAGE_ENTITY_PATTERN])
  @Delete(_API_CTRL_STORAGE_DELETE_ENTITY)
  async deleteById(
    @Param('name') name: string,
    @Param('id') id: string,
    @QueryParam('opts') opts: IDeleteOptions = {},
    @CurrentUser() user: any) {
    const { ref, controller } = this.getControllerForEntityName(name, opts?.storage);
    if (isArray(ref)) {
      throw new Error('multiple entity ref are not supported for "delete"');
    }
    let conditions = controller.entityIdQuery ? controller.entityIdQuery(ref, id) : Expressions.parseLookupConditions(ref, id);
    if (conditions.length > 1) {
      // multiple ids should be bound by 'or', else it would be 'and'
      conditions = { $or: conditions };
    }

    const options: IDeleteOptions = {};
    StorageAPIController.checkOptions(opts, options);
    try {
      const results = await controller.find(
        ref.getClassRef().getClass(),
        conditions,
        options
      );

      if (results.length > 0) {
        return controller.remove(results);
      }
      this.invoker.use(StorageAPIControllerApi)
        .postProcessResults('delete', ref, results, {
          name: name,
          id: id,
          opts: opts,
          user: user
        });
      return results;
    } catch (e) {
      throw new HttpResponseError(['storage', 'delete'], e.message);
    }
  }


  /**
   * Delete records by conditions
   *
   * @param name
   * @param id
   * @param opts
   * @param data
   * @param user
   */
  @Access([
    PERMISSION_ALLOW_DELETE_STORAGE_ENTITY,
    PERMISSION_ALLOW_DELETE_STORAGE_ENTITY_PATTERN])
  @Delete(_API_CTRL_STORAGE_DELETE_ENTITIES_BY_CONDITION)
  async deleteByQuery(@Param('name') name: string,
    @QueryParam('query') query: any = {},
    @QueryParam('opts') opts: IDeleteOptions = {},
    @CurrentUser() user: any) {

    if (!query || isEmpty(query)) {
      // multiple ids should be bound by 'or', else it would be 'and'
      throw new HttpResponseError(['storage', 'delete'], 'query for selection is empty');
    }
    const { ref, controller } = this.getControllerForEntityName(name, opts?.storage);
    if (isArray(ref)) {
      throw new Error('multiple entity ref are not supported for "update"');
    }
    const options: IDeleteOptions = {};
    StorageAPIController.checkOptions(opts, options);
    try {
      const results = await controller.remove(
        ref.getClassRef().getClass(),
        query,
        options
      );

      this.invoker.use(StorageAPIControllerApi)
        .postProcessResults('delete', ref, results, {
          name: name,
          query: query,
          opts: opts,
          user: user
        });
      return results;
    } catch (e) {
      throw new HttpResponseError(['storage', 'delete'], e.message);
    }
  }


  private getControllerForEntityName(
    name: string, storage: string, user?: IRolesHolder): { ref: IEntityRef | IEntityRef[]; controller: IEntityController } {
    const storageRef = this.getStorageRef(name, storage);
    const controller = storageRef.getController();
    const entityRef = this.getEntityRef(storageRef, name, user);
    return {
      ref: entityRef,
      controller: controller
    };
  }


  private getEntityRef(storageRef: IStorageRef, entityName: string, user?: IRolesHolder): IEntityRef | IEntityRef[] {
    const entityRef = storageRef.getEntityRef(entityName);
    if (!entityRef) {
      throw new HttpResponseError(['storage', 'entity_ref_not_found'], 'Entity reference not found for ' + name);
    }
    if (user && user['getRoles'] && isFunction(user['getRoles'])) {
      const _isArray = isArray(entityRef);
      const entitiesToCheck: IEntityRef[] = _isArray ? entityRef as any[] : [entityRef];
      const allowedEntities = [];
      const roles = user.getRoles();
      const permissions = PermissionHelper.getPermissionNamesFromRoles(roles);
      for (const entity of entitiesToCheck) {
        if (PermissionHelper.checkPermission(permissions,
          PERMISSION_ALLOW_ACCESS_STORAGE_ENTITY_PATTERN.replace(':name', entity.machineName))) {
          allowedEntities.push(entity);
        }
      }

      if (allowedEntities.length > 0) {
        if (_isArray) {
          return allowedEntities;
        } else {
          return allowedEntities.shift();
        }
      } else {
        // eslint-disable-next-line max-len
        throw new HttpResponseError(['storage', 'entity_ref_not_found'], 'Entity reference not found for ' + name + ' or permissions are not given.');
      }
    }
    return entityRef;
  }

  private getStorageRef(entityName: string, storage: string): IStorageRef {
    let storageRef = null;
    if (storage) {
      storageRef = this.storage.get(storage);
    } else {
      storageRef = this.storage.forClass(entityName);
    }
    if (!storageRef) {
      throw new HttpResponseError(['storage', 'reference_not_found'], 'Storage containing entity ' + entityName + ' not found');
    }
    return storageRef;
  }


  private prepareEntities(entityDef: IEntityRef, data: any, options: ISaveOptions = {}) {
    const buildOpts: IBuildOptions = {
      beforeBuild: StorageAPIController._beforeBuild
    };
    if (options.raw) {
      buildOpts.createAndCopy = options.raw;
    }
    let entities;
    if (isArray(data)) {
      entities = data.map(d => entityDef.build(d, buildOpts));
    } else {
      entities = entityDef.build(data, buildOpts);
    }
    return entities;
  }


  private async getFilterKeys(): Promise<string[]> {
    // TODO cache this!
    const cacheKey = 'storage_filter_keys';
    let filterKeys: string[] = await this.cache.get(cacheKey);
    if (filterKeys) {
      return filterKeys;
    }

    filterKeys = ['user', 'username', 'password'];
    const res: string[][] = <string[][]><any>this.invoker.use(SystemNodeInfoApi).filterConfigKeys();
    if (res && isArray(res)) {
      filterKeys = uniq(concat(filterKeys, ...res.filter(x => isArray(x))).filter(x => !isEmpty(x)));
    }
    await this.cache.set(cacheKey, filterKeys);
    return filterKeys;
  }

  /**
   * Integrate
   *
   * TODO fetch only if permissions for the entities is set
   *
   * @param storageName
   * @param withCollections
   * @param refresh
   * @param user
   * @private
   */
  private async getStorageSchema(storageName: string, withCollections: boolean = false, refresh: boolean = false, user?: any) {
    const cacheKey = 'storage-schema-' + storageName + (withCollections ? '-with-collection' : '');
    const cacheBin = 'storage-info';

    let entry: IStorageRefMetadata = await this.cache.get(cacheKey, cacheBin);
    if (entry && !refresh) {
      return entry;
    }

    const storageRef = this.storage.get(storageName);
    const options = cloneDeep(storageRef.getOptions());
    const filterKeys = await this.getFilterKeys();
    TreeUtils.walk(options, (x: WalkValues) => {
      if (isString(x.key) && filterKeys.indexOf(x.key) !== -1) {
        delete x.parent[x.key];
      }
      if (isFunction(x.value)) {
        if (isArray(x.parent)) {
          x.parent[x.index] = ClassLoader.getClassName(x.value);
        } else {
          x.parent[x.key] = ClassLoader.getClassName(x.value);
        }
      }
    });

    const ns = storageRef.getRegistry().getLookupRegistry().getNamespace();
    entry = {
      name: storageName,
      type: storageRef.getType(),
      framework: storageRef.getFramework(),
      namespace: ns,
      // synchronize: options.synchronize,
      options: options,
      schema: null
    };

    const serializer = this.getSerializer({ storage: storageName, namespace: ns });
    for (const ref of storageRef.getEntityRefs()) {
      if (ref && isEntityRef(ref)) {
        serializer.serialize(ref);
      }
    }

    entry.schema = serializer.getJsonSchema() ? serializer.getJsonSchema() : {};
    try {
      this.invoker.use(StorageAPIControllerApi).modifyStorageSchema(entry);
    } catch (e) {
    }

    if (withCollections) {
      entry.collections = await this.getStorageRefCollections(storageRef);
    }

    await this.cache.set(cacheKey, entry, cacheBin, { ttl: 24 * 60 * 60 * 1000 });
    return entry;
  }

  private getSerializer(add: any = {}) {
    return JsonSchema.getSerializer({
      onlyDecorated: true,
      ignoreUnknownType: true,
      /**
       * Append storageName to entity object
       * @param src
       * @param dst
       */
      postProcess: (src, dst, serializer) => {
        if (isEntityRef(src)) {
          dst.namespace = src.getNamespace();
          assign(dst, add);
        } else if (src.metaType === METATYPE_PROPERTY) {
          const type = src.getType();
          const opts = src.getOptions();
          if (type === 'datetime' ||
            get(opts, 'metadata.options.sourceType') === 'datetime' ||
            get(opts, 'metadata.options.sourceType') === 'date') {
            dst.type = T_STRING;
            dst.format = 'date-time';
          }
        }
        this.invoker.use(StorageAPIControllerApi).serializationPostProcess(src, dst, serializer);
      }
    });
  }


  private async getStorageRefCollections(ref: IStorageRef): Promise<ICollection[]> {
    try {
      const collectionNames = await ref.getRawCollectionNames();
      return await ref.getRawCollections(collectionNames);
    } catch (e) {
      Log.error(e);
    }
    return [];
  }

}
