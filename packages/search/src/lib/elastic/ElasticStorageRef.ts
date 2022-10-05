import { defaults, get, has, isArray, isEmpty, isNull, isString, keys, orderBy, remove, snakeCase, uniq } from 'lodash';
import { ClassRef, ClassType, IClassRef, IEntityRef, LookupRegistry, METATYPE_ENTITY, RegistryFactory } from '@allgemein/schema-api';
import { CLS_DEF, ICollection, Injector, Invoker, Log, NotYetImplementedError, StorageRef } from '@typexs/base';
import { ElasticConnection } from './ElasticConnection';
import { ElasticEntityController } from './ElasticEntityController';
import { IElasticStorageRefOptions } from './IElasticStorageRefOptions';
import { IndexElasticApi } from '../../api/IndexElastic.api';
import { ClassUtils, LockFactory } from '@allgemein/base';
import { IndexEntityRef } from '../registry/IndexEntityRef';
import { IndexEntityRegistry } from '../registry/IndexEntityRegistry';
import { ElasticUtils } from './ElasticUtils';
import { ClientOptions } from '@elastic/elasticsearch';
import { IElasticFieldDef } from './IElasticFieldDef';
import { OpsHelper } from './ops/OpsHelper';
import { IIndexStorageRef } from '../IIndexStorageRef';
import { C_ELASTIC_SEARCH, C_SEARCH_INDEX, ES_IDFIELD } from '../Constants';
import { ElasticMapping } from './mapping/ElasticMapping';
import { ElasticMappingUpdater } from './mapping/ElasticMappingUpdater';


export class ElasticStorageRef extends StorageRef implements IIndexStorageRef {

  private connections: ElasticConnection[] = [];

  private controller: ElasticEntityController;

  private types: IndexEntityRef[] = [];

  private LOCK = LockFactory.$().semaphore(1);

  private _checked: any = null;

  private _prepared: boolean = false;

  private _checkedReady = false;

  /**
   * Cached elastic mappings
   *
   * @private
   */
  private mappings: { [k: string]: ElasticMapping } = {};

  private fields: IElasticFieldDef[] = [];

  private invoker: Invoker;


  constructor(options: IElasticStorageRefOptions) {
    super(defaults(options, <IElasticStorageRefOptions>{
      framework: C_SEARCH_INDEX,
      type: C_ELASTIC_SEARCH,
      host: '127.0.0.1',
      port: 9200
    }));
  }


  initialize(): boolean {
    // throw new Error('Method not implemented.');
    return true;
  }


  /**
   * Name of framework used
   */
  getFramework(): string {
    return C_SEARCH_INDEX;
  }


  /**
   * Name of subtype in framework
   */
  getType(): string {
    return C_ELASTIC_SEARCH;
  }

  getInvoker() {
    return this.invoker;
  }

  /**
   * Check if storage is readonly
   */
  isReadonly(): boolean {
    return get(this.getOptions(), 'readonly', false);
  }

  getRegistry(): IndexEntityRegistry {
    return RegistryFactory.get(C_SEARCH_INDEX) as IndexEntityRegistry;
  }

  /**
   * initial called after contruction
   */
  async prepare(): Promise<boolean> {
    if (this._prepared) {
      return true;
    }
    this._prepared = true;
    // initialise index?
    this.controller = new ElasticEntityController(this);
    this.invoker = Injector.get(Invoker.NAME);

    const indexTypes = this.getOptions().indexTypes;
    if (indexTypes && isArray(indexTypes)) {
      for (const indexType of indexTypes) {
        const indexName = indexType.index;
        const allowAutoAppendAllField = get(indexType, 'autoAppendAllField', false);
        for (const e of indexType.entities) {
          if (isString(e)) {
            const machineName = snakeCase(e);
            // TODO lookup registry can be null???
            const registries = LookupRegistry.getLookupRegistries().filter(x => !!x);
            const results = [].concat(...registries
              .map(r =>
                r.filter<IEntityRef>(METATYPE_ENTITY,
                  (x: IEntityRef) =>
                    snakeCase(x.getClassRef().name) === machineName || x.storingName === machineName
                )
              )
            );
            if (results.length > 0) {
              for (const r of results) {
                // _lookupRegistry
                const ref = IndexEntityRegistry.$()._create(r, indexName,
                  { allowAutoAppendAllField: allowAutoAppendAllField });
                this.types.push(ref);
              }
            } else {
              // no results`
              Log.warn(`Can't append index for type(s) ${e} cause it doesn't exists`);
            }
          }
        }
      }
    }

    if (!isEmpty(this.types)) {
      for (const type of this.types) {
        const fields = ElasticUtils.flattenProperties(type);
        for (const field of fields) {
          field.indexName = type.getAliasName();
          field.typeName = type.getTypeName();
          if ([ES_IDFIELD].includes(field.name)) {
            continue;
          }
          this.fields.push(field);
        }
      }
    }


    if (this.getOptions().connectOnStartup) {
      await this.checkIndices();
    }
    return true;
  }

  /**
   * Entity reload
   */
  reload(): Promise<boolean> | boolean {
    throw new NotYetImplementedError('reload');
  }

  /**
   * Reset check status to allow a recheck
   */
  resetCheck() {
    this._checkedReady = false;
    this._checked = null;
  }

  getFields() {
    return this.fields;
  }

  /**
   * Check if index exists and if not create if
   */
  async checkIndices(): Promise<{ [indexName: string]: boolean }> {
    if (this.isReadonly()) {
      return {};
    }
    if (this.isChecked()) {
      return this._checked;
    }
    await this.LOCK.acquire();
    if (this._checked) {
      this.LOCK.release();
      return this._checked;
    }
    this._checkedReady = false;
    try {
      this._checked = {};
      const aliasNames = this.getAliasNames();
      if (isArray(aliasNames) && !isEmpty(aliasNames)) {
        const connection = await this.connect(true);
        const client = connection.getClient();
        const mappingUpdater = new ElasticMappingUpdater(client);
        await mappingUpdater.reload();
        for (let i = 0; i < aliasNames.length; i++) {
          const aliasName = aliasNames[i];
          const neededMapping = await this.getIndexCreateData(aliasName);
          const indexName = neededMapping.indexName;
          let mapping = mappingUpdater.getBy(indexName, 'name');
          let res: boolean = null;
          if (!mapping) {
            res = await mappingUpdater.create(neededMapping);
          } else {
            mapping.merge(neededMapping);
            if (neededMapping.hasChanges()) {
              if (neededMapping.toReindex()) {
                res = await mappingUpdater.reindex(neededMapping);
              } else {
                res = await mappingUpdater.update(neededMapping);
              }
            } else {
              res = true;
            }
          }
          await mappingUpdater.reload(indexName);
          mapping = mappingUpdater.getBy(indexName, 'name');
          this.mappings[mapping.indexName] = mapping;
          this._checked[mapping.indexName] = res;
        }
        await connection.close();
      }
    } catch (e) {
      Log.error(e);
    }
    this._checkedReady = true;
    this.LOCK.release();
    return this._checked;
  }


  async refresh(indexNames: string[]) {
    const connection = await this.connect(true);
    const client = connection.getClient();
    const { body } = await client.indices.refresh({ index: indexNames });
    await connection.close();
    return body;
  }


  async getIndexCreateData(indexName: string) {
    const mapping = new ElasticMapping(indexName);
    const entityRefs = this.getIndexTypes(indexName);
    for (const ref of entityRefs) {
      const properties = ElasticUtils.buildMappingPropertiesTree(ref);
      keys(properties).map(x => {
        mapping.add(x, properties[x]);
      });
    }
    await this.invoker.use(IndexElasticApi).doBeforeIndexRepositoryCreate(mapping, entityRefs);
    return mapping;
  }


  /**
   * Return supported types as IEntityIndexRef
   *
   * @param indexName
   */
  getIndexTypes(aliasName?: string) {
    if (aliasName) {
      return this.types.filter(x => x.getAliasName() === aliasName);
    }
    return this.types;
  }

  /**
   * Return names of indices
   */
  getAliasNames(): string[] {
    return uniq(orderBy(this.types.map(x => x.getAliasName())));
  }


  /**
   * Connect to server and return connection handle
   *
   * @return Promise<ElasticConnection>
   */
  async connect(skipCheck: boolean = false): Promise<ElasticConnection> {
    const opts = <IElasticStorageRefOptions>this.getOptions();
    const esOpts = <ClientOptions>{
      node: (opts.ssl ? 'https://' : 'http://') + opts.host + ':' + opts.port
    };
    const passParams = ['apiVersion'];
    for (const param of passParams) {
      if (has(opts, param)) {
        esOpts[param] = opts[param];
      }
    }
    const connection = new ElasticConnection(this, esOpts);
    await connection.connect();
    this.connections.push(connection);

    if (!skipCheck && !this.isChecked()) {
      await this.checkIndices();
    }
    return Promise.resolve(connection);
  }

  /**
   * Checks if necessary mappings are already passed
   */
  isChecked() {
    return this._checkedReady && !isNull(this._checked);
  }

  /**
   * Return entity controller
   */
  getController(): ElasticEntityController {
    return this.controller;
  }

  getEntityNames(): string[] {
    throw new NotYetImplementedError('getEntityNames');
  }

  getEntityRef(name: CLS_DEF<any>, byIndexedType: boolean = false): any {
    let tEntry = null;
    let className = null;
    if (!isString(name)) {
      if (name instanceof ClassRef) {
        className = name.name;
      } else if (name['getClass']) {
        className = ClassUtils.getClassName(name['getClass']());
      } else {
        className = ClassUtils.getClassName(<any>name);
      }
    } else {
      className = name;
    }

    if (className) {
      const refs = OpsHelper.getEntityRefByPattern(className, this.getEntityRefs(), byIndexedType);
      if (isEmpty(refs)) {
        return null;
      }

      if (refs.length === 1) {
        tEntry = refs[0];
      } else {
        return refs;
      }
    }

    if (tEntry) {
      return tEntry;
    }
    return null;
  }

  getEntityRefs(filter?: (x: IndexEntityRef) => boolean): IndexEntityRef[] {
    if (filter) {
      return this.types.filter(filter);
    }
    return this.types;
  }


  getRawCollection(name: string): ICollection | Promise<ICollection> {
    throw new NotYetImplementedError('getRawCollection');
  }

  getRawCollectionNames(): string[] | Promise<string[]> {
    return this.types.map(x => x.getAliasName() + '.' + x.getTypeName());
  }

  getRawCollections(collectionNames: string[]): ICollection[] | Promise<ICollection[]> {
    throw new NotYetImplementedError('getRawCollections');
  }

  hasEntityClass(cls: string | Function | IClassRef | IEntityRef, byIndexedType: boolean = false): boolean {
    if (isString(cls) &&
      OpsHelper.hasEntityRefByPattern(cls, this.getEntityRefs())) {
      return true;
    }
    return !!this.getEntityRef(cls, byIndexedType);
  }


  isActive(): boolean {
    return true; // this.isChecked();
  }


  /**
   * Get elastic options
   */
  getOptions(): IElasticStorageRefOptions {
    return super.getOptions() as IElasticStorageRefOptions;
  }


  /**
   * Remove a connection by id
   *
   * @param wrapper
   */
  async remove(wrapper: ElasticConnection) {
    remove(this.connections, { inc: wrapper.inc });
  }


  private async closeConnections(): Promise<any> {
    const ps: Promise<any> [] = [];
    while (this.connections.length > 0) {
      ps.push(this.connections.shift().close());
    }
    return Promise.all(ps).catch(x => {
    });
  }


  async shutdown(full: boolean = true): Promise<void> {
    try {
      await this.closeConnections();
    } catch (e) {
    }
  }


}
