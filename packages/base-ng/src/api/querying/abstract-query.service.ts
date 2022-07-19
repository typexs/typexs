import {
  clone,
  isArray,
  isBoolean,
  isEmpty,
  isNumber,
  isObjectLike,
  isPlainObject,
  isString,
  keys,
  snakeCase,
  uniq,
  values,
  concat
} from 'lodash';
import { IQueringService } from './IQueringService';
import { BehaviorSubject, Observable, of, Subscription } from 'rxjs';
import {
  IBuildOptions,
  IEntityRef,
  IJsonSchema,
  ILookupRegistry,
  IParseOptions,
  JsonSchema,
  METATYPE_ENTITY,
  METATYPE_PROPERTY,
  RegistryFactory,
  supportsJsonSchemaImport
} from '@allgemein/schema-api';
import { IApiCallOptions } from '../../lib/http/IApiCallOptions';
import { STORAGE_REQUEST_MODE } from './Constants';
import { Log } from '../../lib/log/Log';
import { UrlHelper } from '../../lib/UrlHelper';
import { filter, first } from 'rxjs/operators';
import { EntityResolverService } from '../../services/entity-resolver.service';
import { IRoutePointer } from '../backend/IRoutePointer';
import { IQueryServiceOptions } from './IQueryServiceOptions';
import { IAggregateOptions } from './IAggregateOptions';
import { IFindOptions } from './IFindOptions';
import { ISaveOptions } from './ISaveOptions';
import { IUpdateOptions } from './IUpdateOptions';
import { IBackendClientService } from '../backend/IBackendClientService';
import { IAuthServiceProvider } from '../auth/IAuthServiceProvider';
import { resolveNamespaces } from '../../lib/functions';
import { C_DEFAULT } from '../../constants';


export abstract class AbstractQueryService implements IQueringService {

  protected $isReady: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  private _backend: IBackendClientService;

  private _entityResolverService: EntityResolverService;

  private _authService: IAuthServiceProvider;

  private options: IQueryServiceOptions;

  private namespaces: string[] = [];


  constructor(
    backend: IBackendClientService,
    authService: IAuthServiceProvider,
    entityResolverService: EntityResolverService,
    options: IQueryServiceOptions) {
    this._backend = backend;
    this._authService = authService;
    this._entityResolverService = entityResolverService;
    this._entityResolverService.registerService(this);
    this.options = options;
    this.initialize();

  }

  isSupported(type: STORAGE_REQUEST_MODE) {
    return !!this.options.routes[type];
  }


  getRoute(type: STORAGE_REQUEST_MODE): IRoutePointer {
    const route = this.options.routes[type];
    if (isString(route)) {
      const _route: IRoutePointer = {
        route: route,
        method: 'get'
      };
      switch (type) {
        case 'delete':
        case 'delete_by_condition':
          _route.method = 'delete';
          break;
        case 'update':
        case 'save':
          _route.method = 'post';
          break;
        case 'update_by_condition':
          _route.method = 'put';
          break;
      }
      return _route;
    } else {
      return route;
    }

  }

  initialize() {
    if (this._authService.isEnabled()) {
      // this.getRegistry().reset();
      let subscription: Subscription = null;
      this._authService.isInitialized().subscribe(x => {
        if (x) {
          subscription = this._authService.isLoggedIn().subscribe(isLoggedIn => {
            if (isLoggedIn) {
              this.loadEntityMetadata();
            } else {
              this.$isReady.next(false);
            }
          });
        } else {
          if (subscription) {
            subscription.unsubscribe();
            this.$isReady.next(false);
          }
        }
      });
    } else {
      this.loadEntityMetadata();
    }
  }

  getNamespaces(): string[] {
    return this.namespaces;
  }

  // getRegistry() {
  //   if (this.options.registry) {
  //     return this.options.registry;
  //   } else if (this.options.registryName) {
  //     return RegistryFactory.get(this.options.registryName);
  //   }
  //   throw new Error('registry not supported for this service.');
  // }

  /**
   * return the Entity describing reference or null if not present
   * @param name
   */
  getEntityRefForName(name: string): IEntityRef {
    if (this.namespaces.length === 0) {
      return null;
    }
    const snakeCaseName = snakeCase(name);
    return this.getEntityRefs().find((x: IEntityRef) =>
      x.name === name ||
      x.getClassRef().name === name ||
      snakeCase(x.name) === snakeCaseName ||
      snakeCase(x.getClassRef().name) === snakeCaseName
    );
  }


  /**
   * checks if metadata model is ready to be used
   */
  isReady(): Observable<boolean> ;
  // eslint-disable-next-line no-dupe-class-members
  isReady(callback: Function): void ;
  // eslint-disable-next-line no-dupe-class-members
  isReady(callback?: Function): Observable<boolean> | void {
    if (!callback) {
      return this.$isReady.asObservable();
    } else {
      if (this.$isReady.getValue()) {
        callback();
      }
      this.$isReady.asObservable().subscribe(value => {
        if (isBoolean(value)) {
          callback(value);
        }
      }, error => {
        callback(null, error);
      }, () => {
        // callback();
      });
    }
  }

  /**
   * checks if metadata model is ready to be used
   */
  isLoaded(): Observable<boolean> {
    return this.$isReady.asObservable().pipe(filter(x => x)).pipe(first());
  }


  /**
   * Metadata are passed as json schema description. Here the data are interpreted back to ILookupRegistry object.
   */
  loadEntityMetadata() {
    if (!this.isSupported('metadata')) {
      Log.warn('loading metadata for ' + this.options.ngRoutePrefix + ' is not supported');
      this.$isReady.next(true);
      return;
    }
    if (!this.$isReady.getValue()) {
      this.namespaces.map(ns => RegistryFactory.get(ns).reset());
      this.namespaces = [];
      // const reg = this.getRegistry();
      const observable = this._backend.callApi<IJsonSchema>(this.getRoute('metadata'), {});
      observable.subscribe(
        async value => {
          if (isArray(value)) {
            // if multiple json schemas are
            for (const entityDefJson of value) {
              await this.loadJsonSchema(entityDefJson);
            }
          } else {
            await this.loadJsonSchema(value);
          }
          this.$isReady.next(true);
        },
        error => {
          this.$isReady.next(false);
        });
    }
  }

  private loadJsonSchema(value: any) {
    if (isObjectLike(value) && value['$schema']) {
      const namespaces = resolveNamespaces(value);
      let namespace = C_DEFAULT;
      if (namespaces.length > 0) {
        // take first namespace
        namespace = namespaces.shift();
      }
      if (!this.namespaces.includes(namespace)) {
        this.namespaces.push(namespace);
      }
      const reg = RegistryFactory.get(namespace);
      if (supportsJsonSchemaImport(reg)) {
        return reg.fromJsonSchema(value);
      } else {
        return this.unserialize(value, reg);
      }
    }
    return null;
  }


  unserialize(value: any, reg: ILookupRegistry) {
    return JsonSchema.unserialize(value, {
      namespace: reg.getLookupRegistry().getNamespace(),
      collector: [
        {
          type: METATYPE_PROPERTY,
          fn: function(key: string, data: any, options: IParseOptions) {
            // passing all properties
            const r = {};
            keys(data)
              .filter(k => !(['type', 'metaType', 'propertyName', 'properties'].includes(k) || k.startsWith('$')))
              .map(x => r[x] = data[x]);
            return r;
          }
        }
      ]
    });
  }

  setNgUrlPrefix(prefix: string) {
    this.options.ngRoutePrefix = prefix;
  }

  getNgUrlPrefix() {
    return this.options.ngRoutePrefix;
  }


  getRegistries() {
    return this.namespaces.map(ns => RegistryFactory.get(ns));
  }

  getEntityRefs() {
    return concat([], ...this.getRegistries().map(reg => reg.getEntityRefs()));
  }

  getEntityRefFor(fn: string | object | Function, skipNsCheck?: boolean) {
    for (const reg of this.getRegistries()) {
      const ref = reg.getEntityRefFor(fn, skipNsCheck);
      if (ref) {
        return ref;
      }
    }
    return null;
  }


  buildOptions?(
    method: STORAGE_REQUEST_MODE,
    options: any /* IFindOptions*/, buildOptions: IBuildOptions = {}) {
  }

  buildEntity?(
    method: STORAGE_REQUEST_MODE,
    entityRef: IEntityRef, entity: any | any[],
    buildOptions: IBuildOptions = {}) {
    return entity;
  }


  /**
   * TODO
   * @param entityName
   * @param entityId
   * @param options
   */
  get(entityName: string, entityId: any, options: IFindOptions = {}) {
    if (!this.options.routes.get) {
      throw new Error('Url for getting a single entity is missing.');
    }
    const entityDef = this.getEntityRefForName(entityName);
    // const obs = new BehaviorSubject<any>(null);
    let buildEntityId = null;
    if (isString(entityId) || isNumber(entityId)) {
      buildEntityId = entityId;
    } else if (isPlainObject(entityId) && !isEmpty(values(entityId))) {
      buildEntityId = UrlHelper.buildId(entityId);
    }

    if (!buildEntityId) {
      throw new Error('id for entity name is wrong ' + entityName + ' = ' + JSON.stringify(entityId));
    }
    const apiParams = { name: entityName, id: buildEntityId };
    const additinalQuery: any = {};
    // let apiUrl = this.apiUrl(this.options.urlGetEntity, );
    if (!isEmpty(options)) {
      // apiUrl += '?opts=' + JSON.stringify(options);
      additinalQuery.opts = JSON.stringify(options);
    }
    const buildOptions: IBuildOptions = {};
    this.buildOptions('get', options, buildOptions);

    return this.callApi(this.getRoute('get'), {
      params: apiParams,
      query: additinalQuery
    }, x => this.buildEntity('get', entityDef, x, buildOptions));
  }


  /**
   * Return results for an query request to the backend
   *
   * @param entityName
   * @param query
   * @param options
   */
  query(entityName: string, query: any = null, options: IFindOptions = {}) {
    if (!this.isSupported('query')) {
      throw new Error('Url for querying entities is missing.');
    }
    return this._query(entityName, query, null, options);
  }


  /**
   * Return results of an aggregation request to the backend
   *
   * @param entityName
   * @param aggr
   * @param options
   */
  aggregate(entityName: string, aggr: any = [], options: IAggregateOptions = {}) {
    if (!this.isSupported('aggregate')) {
      throw new Error('Url for aggregating entities is missing.');
    }
    return this._query(entityName, null, aggr, options);
  }


  /**
   * Generic method for execution of query or aggregation request
   *
   * @param entityName
   * @param query
   * @param options
   */
  private _query(entityName: string, query: any = null, aggr: any = null, options: IFindOptions = {}) {
    const _opts = clone(options);
    const entityDef = this.getEntityRefForName(entityName);
    const apiParams = { name: entityName };
    const additinalQuery: any = {};
    let aggrMode = false;
    if (isPlainObject(query)) {
      additinalQuery.query = query;
    } else if (isPlainObject(aggr) || isArray(aggr)) {
      additinalQuery.aggr = aggr;
      aggrMode = true;
    } else {
      if (aggr) {
        return of({ entities: [], $count: 0, $limit: 0, $offset: 0 });
      }
    }
    if (isNumber(_opts.limit)) {
      additinalQuery.limit = _opts.limit;
      delete _opts.limit;
    }
    if (isNumber(_opts.offset)) {
      additinalQuery.offset = _opts.offset;
      delete _opts.offset;
    }
    if (isPlainObject(_opts.sort)) {
      additinalQuery.sort = _opts.sort;
      delete _opts.sort;
    }
    if (!isEmpty(_opts)) {
      additinalQuery.opts = _opts;
    }
    const mode = aggrMode ? 'aggregate' : 'query';
    const buildOptions: IBuildOptions = {};
    this.buildOptions(mode, options, buildOptions);
    const apiOptions = { params: apiParams, query: additinalQuery };
    return this.callApi(this.getRoute(aggrMode ? 'aggregate' : 'query'), apiOptions, x => {
      x.entities = this.buildEntity(mode, entityDef, x.entities, buildOptions);
      return x;
    });
  }

  save(entityName: string, entity: any, options: ISaveOptions = {}): Observable<any> {
    if (!this.isSupported('save')) {
      throw new Error('Url for saving entities is missing.');
    }
    const entityDef = this.getEntityRefForName(entityName);
    const apiParams = { name: entityName };
    const additinalQuery: any = {};
    if (!isEmpty(options)) {
      additinalQuery.opts = options;
    }
    const buildOptions: IBuildOptions = {};
    this.buildOptions('save', options, buildOptions);

    return this.callApi(this.getRoute('save'), {
      params: apiParams,
      query: additinalQuery,
      content: entity
    }, x => this.buildEntity('save', entityDef, x, buildOptions));
  }

  /**
   * Two usage variants
   * 1. update only one entity
   * 2. TODO ! update a mass of entities defined by entityId or query conditions with given values
   *
   * @param entityName
   * @param entityId
   * @param entity
   * @param options
   */
  update(entityName: string, entityId: any, entity: any, options: IUpdateOptions = {}) {
    if (!this.isSupported('update')) {
      throw new Error('Url for update entities is missing.');
    }
    // TODO if empty entity ???
    const entityDef = this.getEntityRefForName(entityName);
    const id = UrlHelper.buildLookupConditions(entityDef, entity);
    if (entityId !== id) {
      throw new Error('something is wrong');
    }

    const apiParams = { name: entityName, id: entityId };
    const additinalQuery: any = {};
    if (!isEmpty(options)) {
      additinalQuery.opts = options;
    }
    const buildOptions: IBuildOptions = {};
    this.buildOptions('update', options, buildOptions);

    return this.callApi(this.getRoute('update'), {
      params: apiParams,
      query: additinalQuery, content: entity
    }, x => this.buildEntity('update', entityDef, x, buildOptions));
  }

  /**
   * Two usage variants
   * 1. update only one entity
   * 2. TODO ! update a mass of entities defined by entityId or query conditions with given values
   *
   * @param entityName
   * @param entityId
   * @param entity
   * @param options
   */
  updateByCondition(entityName: string, condition: any, update: any, options: ISaveOptions = {}) {
    if (!this.isSupported('update_by_condition')) {
      throw new Error('Url for update by conditions is missing.');
    }
    // TODO if empty entity ???
    const entityDef = this.getEntityRefForName(entityName);

    if (!update) {
      throw new Error('Something is wrong.');
    }

    if (!condition) {
      throw new Error('Something is wrong.');
    }

    const apiParams = { name: entityName };
    const additinalQuery: any = {
      query: condition
    };
    if (!isEmpty(options)) {
      additinalQuery.opts = options;
    }
    const buildOptions: IBuildOptions = {};
    this.buildOptions('update', options, buildOptions);

    return this.callApi(this.getRoute('update_by_condition'), {
      params: apiParams,
      query: additinalQuery,
      content: update
    }, x => this.buildEntity('update', entityDef, x, buildOptions));
  }

  /**
   * TODO
   * - mass delete
   * @param entityName
   * @param entityId
   * @param options
   */
  delete(entityName: string, entityId: any, options: any = {}) {
    if (!this.isSupported('delete')) {
      throw new Error('Url for delete entities is missing.');
    }
    const entityDef = this.getEntityRefForName(entityName);
    const apiParams = { name: entityName, id: entityId };
    const additinalQuery: any = {};
    if (!isEmpty(options)) {
      additinalQuery.opts = options;
    }
    const buildOptions: IBuildOptions = {};
    this.buildOptions('delete', options, buildOptions);

    return this.callApi(this.getRoute('delete'), {
      params: apiParams,
      query: additinalQuery
    }, x => this.buildEntity('delete', entityDef, x, buildOptions));
  }

  /**
   * TODO
   * - mass delete
   * @param entityName
   * @param entityId
   * @param options
   */
  deleteByCondition(entityName: string, condition: any, options: any = {}) {
    const type = 'delete_by_condition';
    if (!this.isSupported(type)) {
      throw new Error('Url for delete by condition is missing.');
    }
    if (!condition) {
      throw new Error('Condition not found');
    }
    const entityDef = this.getEntityRefForName(entityName);
    const apiParams = { name: entityName };
    const additinalQuery: any = {
      query: condition
    };
    if (!isEmpty(options)) {
      additinalQuery.opts = options;
    }
    const buildOptions: IBuildOptions = {};
    this.buildOptions('delete', options, buildOptions);

    return this.callApi(this.getRoute(type), {
      params: apiParams,
      query: additinalQuery
    }, x => this.buildEntity('delete', entityDef, x, buildOptions));
  }


  callApi(context: string | IRoutePointer, api: IApiCallOptions, resultHandle?: (x: any) => any) {
    const obs = new BehaviorSubject<any>(null);
    const observable = this._backend.callApi(context, api);
    observable.subscribe(
      value => {
        if (resultHandle) {
          const result = resultHandle(value);
          obs.next(result);
        } else {
          obs.next(value);
        }
        obs.complete();
      },
      error => {
        obs.error(error);
        obs.complete();
      });
    return obs.asObservable();
  }


}
