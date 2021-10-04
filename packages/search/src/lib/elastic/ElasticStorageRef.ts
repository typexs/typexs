import * as _ from 'lodash';
import {ClassRef, ClassType, IClassRef, IEntityRef, LookupRegistry, XS_TYPE_ENTITY} from 'commons-schema-api/browser';
import {ICollection, Injector, Invoker, Log, NotYetImplementedError, StorageRef} from '@typexs/base';
import {ElasticConnection} from './ElasticConnection';
import {ElasticEntityController} from './ElasticEntityController';
import {IElasticStorageRefOptions} from './IElasticStorageRefOptions';
import {IndexElasticApi} from '../../api/IndexElastic.api';
import {LockFactory} from '@typexs/base/libs/LockFactory';
import {ClassUtils} from '@allgemein/base';
import {IndexEntityRef} from '../registry/IndexEntityRef';
import {IndexEntityRegistry} from '../registry/IndexEntityRegistry';
import {ElasticUtils} from './ElasticUtils';
import {Client, ClientOptions} from '@elastic/elasticsearch';
import {IElasticFieldDef} from './IElasticFieldDef';
import {OpsHelper} from './ops/OpsHelper';
import {IIndexStorageRef} from '../IIndexStorageRef';
import {ES_ALLFIELD} from '../Constants';


export class ElasticStorageRef extends StorageRef implements IIndexStorageRef {

  private connections: ElasticConnection[] = [];

  private controller: ElasticEntityController;

  private types: IndexEntityRef[] = [];

  private LOCK = LockFactory.$().semaphore(1);

  private _checked = null;

  private _prepared: boolean = false;

  private _checkedReady = false;

  private fields: IElasticFieldDef[] = [];

  private invoker: Invoker;


  constructor(options: IElasticStorageRefOptions) {
    super(_.defaults(options, <IElasticStorageRefOptions>{
      framework: 'index',
      type: 'elastic',
      host: '127.0.0.1',
      port: 9200
    }));
  }

  /**
   * Name of framework used
   */
  getFramework(): string {
    return 'index';
  }


  /**
   * Name of subtype in framework
   */
  getType(): string {
    return 'elastic';
  }

  getInvoker() {
    return this.invoker;
  }

  /**
   * Check if storage is readonly
   */
  isReadonly(): boolean {
    return _.get(this.getOptions(), 'readonly', false);
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
    if (indexTypes && _.isArray(indexTypes)) {
      for (const indexType of indexTypes) {
        const indexName = indexType.index;
        const allowAutoAppendAllField = _.get(indexType, 'autoAppendAllField', false);
        for (const e of indexType.entities) {
          if (_.isString(e)) {
            const machineName = _.snakeCase(e);
            // TODO lookupregistry can be null???
            const registries = LookupRegistry.getRegistries().filter(x => !!x);
            const results = [].concat(...registries
              .map(r => r.filter<IEntityRef>(XS_TYPE_ENTITY,
                (x: IEntityRef) =>
                  _.snakeCase(x.name) === machineName || x.storingName === machineName
                )
              )
            );
            if (results.length > 0) {
              for (const r of results) {
                // _lookupRegistry
                const ref = IndexEntityRegistry.$().create(r, indexName, {allowAutoAppendAllField: allowAutoAppendAllField});
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

    if (!_.isEmpty(this.types)) {
      for (const type of this.types) {
        const fields = ElasticUtils.flattenProperties(type);
        for (const field of fields) {
          field.indexName = type.getIndexName();
          field.typeName = type.getTypeName();
          if (['_id'].includes(field.name)) {
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
      const connection = await this.connect(true);
      const client = connection.getClient();
      const indicies = this.getIndiciesNames();
      if (_.isArray(indicies) && !_.isEmpty(indicies)) {
        const existResponses = (await Promise.all(indicies.map(x => client.indices.exists({index: x}))));
        for (let i = 0; i < indicies.length; i++) {
          const indexName = indicies[i];
          let indexExists = existResponses[i].body;

          if (!indexExists) {
            indexExists = await this.createIndex(client, indexName);
          } else {
            // check mapping for updates
            // TODO fix this compare two objects deep
            // indexExists = await this.updateIndexIfChanged(client, indexName);
          }
          this._checked[indexName] = indexExists;
        }
      }
      await connection.close();
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
    const {body} = await client.indices.refresh({index: indexNames});
    await connection.close();
    return body;
  }


  async getIndexCreateData(indexName: string) {
    const indexData: any = {
      index: indexName,
      body: {
        mappings: {
          dynamic_templates: [
            {
              'strings': {
                'match_mapping_type': 'string',
                'mapping': {
                  'type': 'text',
                  'fields': {
                    'keyword': {
                      'type': 'keyword',
                      'ignore_above': 256
                    }
                  },
                  copy_to: [ES_ALLFIELD]
                }
              }
            },
            {
              'integers': {
                'match_mapping_type': 'long',
                'mapping': {
                  'type': 'integer',
                  copy_to: [ES_ALLFIELD]
                }
              }
            }
          ],
          properties: {
            __id: {
              type: 'text',
              fields: {
                keyword: {
                  type: 'keyword',
                  ignore_above: 256
                }
              },
              copy_to: [ES_ALLFIELD]
            },
            __type: {
              type: 'text',
              fields: {
                keyword: {
                  type: 'keyword',
                  ignore_above: 256
                }
              },
              copy_to: [ES_ALLFIELD]
            },
            _label: {
              type: 'text',
              fields: {
                keyword: {
                  type: 'keyword',
                  ignore_above: 256
                }
              },
              copy_to: [ES_ALLFIELD]
            },
            _all: {
              type: 'text',
              fields: {
                keyword: {
                  type: 'keyword',
                  ignore_above: 256
                }
              },
            }
          }
        }
      }
    };

    await this.invoker.use(IndexElasticApi)
      .doBeforeIndexRepositoryCreate(indexData, this.getIndexTypes(indexName));
    return indexData;
  }


  async createIndex(client: Client, indexName: string) {
    const indexData = await this.getIndexCreateData(indexName);

    // overwrite to prevent change
    indexData.index = indexName;
    // TODO call mapping
    try {
      const createIndexResponse = await client.indices.create(indexData);
      return _.get(createIndexResponse.body, 'acknowledged', false);
    } catch (e) {
      Log.error(e);
      return false;
    }
  }


  async updateIndexIfChanged(client: any, indexName: string): Promise<boolean> {
    const demandedIndexData = await this.getIndexCreateData(indexName);

    const {body} = await client.indices.get({index: indexName});
    const indexData = body[indexName];
    const demandBody = demandedIndexData.body;

    let update = false;

    // check mapping
    if (_.has(indexData, 'mappings.properties') && _.has(demandBody, 'mappings.properties')) {
      for (const fieldName of _.keys(demandBody.mappings.properties)) {
        const demandedFieldMapping = demandBody.mappings.properties[fieldName];
        if (_.has(indexData, 'mappings.properties.' + fieldName)) {
          // check if changed
          if (!_.isEqual(indexData.mappings.properties[fieldName], demandedFieldMapping)) {
            _.merge(indexData.mappings.properties[fieldName], demandedFieldMapping);
            update = true;
          }
        } else {
          // add
          _.set(indexData, 'mappings.properties.' + fieldName, demandedFieldMapping);
          update = true;
        }
      }
    }

    if (update) {
      Log.info('update elastic index mapping for index: ' + indexName);
      await client.indices.putMapping({index: indexName, body: indexData.mappings});
    }
    return true;
  }


  /**
   * Return supported types as IEntityIndexRef
   *
   * @param indexName
   */
  getIndexTypes(indexName?: string) {
    if (indexName) {
      return this.types.filter(x => x.getIndexName() === indexName);
    }
    return this.types;
  }

  /**
   * Return names of indices
   */
  getIndiciesNames() {
    return _.uniq(_.orderBy(this.types.map(x => x.indexName)));
  }

  /**
   * TODO
   * @param type
   * @param options
   */
  addEntityClass(type: Function | IClassRef | ClassType<any>, options?: any): void {
    throw new NotYetImplementedError('reload');
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
      if (_.has(opts, param)) {
        esOpts[param] = opts[param];
      }
    }
    const connection = new ElasticConnection(this, esOpts);
    try {
      await connection.connect();
      this.connections.push(connection);
    } catch (e) {
      throw e;
    }

    if (!skipCheck && !this.isChecked()) {
      await this.checkIndices();
    }
    return Promise.resolve(connection);
  }

  /**
   * Checks if necessary mappings are already passed
   */
  isChecked() {
    return this._checkedReady && !_.isNull(this._checked);
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

  getEntityRef(name: string | Function | IClassRef,
               byIndexedType: boolean = false): any {
    let tEntry = null;
    let className = null;
    if (!_.isString(name)) {
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
      if (_.isEmpty(refs)) {
        return null;
      }

      if (refs.length === 1) {
        tEntry = refs[0];
      } else {
        return refs;
      }
      //
      // const _name = _.snakeCase(className);
      // tEntry = this.types.find(type =>
      //   byIndexedType ?
      //     _.snakeCase(type.getEntityRef().name) === _name || _.snakeCase(type.name) === _name :
      //     _.snakeCase(type.name) === _name
      // );
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
    return this.types.map(x => x.indexName + '.' + x.typeName);
  }

  getRawCollections(collectionNames: string[]): ICollection[] | Promise<ICollection[]> {
    throw new NotYetImplementedError('getRawCollections');
  }

  hasEntityClass(cls: string | Function | IClassRef, byIndexedType: boolean = false): boolean {
    if (_.isString(cls) &&
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
    _.remove(this.connections, {inc: wrapper.inc});
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