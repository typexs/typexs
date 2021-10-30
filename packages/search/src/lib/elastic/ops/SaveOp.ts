import * as _ from 'lodash';
import { ISaveOp } from '@typexs/base/libs/storage/framework/ISaveOp';
import { ElasticEntityController } from '../ElasticEntityController';
import { IndexElasticApi } from '../../../api/IndexElastic.api';
import { IndexEntityRegistry } from '../../registry/IndexEntityRegistry';
import { DataContainer, Log } from '@typexs/base';
import { Index } from '@elastic/elasticsearch/api/requestParams';
import { IElasticSaveOptions } from './IElasticSaveOptions';
import { OpsHelper } from './OpsHelper';
import { __ID__, __TYPE__, C_SEARCH_INDEX, ES_IDFIELD, ES_TYPEFIELD } from '../../Constants';

export class SaveOp<T> implements ISaveOp<T> {

  error: Error = null;

  readonly controller: ElasticEntityController;


  protected options: IElasticSaveOptions;

  protected objects: T[] = [];

  protected isArray: boolean = true;


  constructor(controller: ElasticEntityController) {
    this.controller = controller;
  }

  getNamespace(): string {
    return C_SEARCH_INDEX;
  }

  getOptions() {
    return this.options;
  }

  getObjects() {
    return this.objects;
  }

  getIsArray() {
    return this.isArray;
  }

  async run(object: T[] | T, options?: IElasticSaveOptions): Promise<T | T[]> {
    options = options || {};
    _.defaults(options, { validate: false, raw: false, passResults: false });
    await this.controller.getInvoker().use(IndexElasticApi).onOptions('save', options);
    this.options = options;
    this.isArray = _.isArray(object);
    this.objects = this.prepare(object);

    await this.controller.getInvoker().use(IndexElasticApi).doBeforeSave(this.objects, this);

    const promises: Promise<any>[] = [];
    const connection = await this.controller.connect();
    try {

      const preparedOpts = _.clone(options);
      ['refresh', 'id', 'index', 'type', 'body', 'validate', 'raw', 'passResults', 'noTransaction'].map(k => delete preparedOpts[k]);
      const indices: string[] = [];
      const client = connection.getClient();
      for (const entity of this.objects as any[]) {
        const entityRef = IndexEntityRegistry.$().getEntityRefFor(entity);
        // const entityName = entityRef.name;
        const id = OpsHelper.getId(entityRef, entity);

        delete entity[ES_IDFIELD];
        delete entity[ES_TYPEFIELD];

        // const idPropertyRefs = entityRef.getPropertyRefs().filter(p => p.isIdentifier());
        // if (idPropertyRefs.length === 0) {
        //   throw new Error('no id property found for ' + entityName);
        // }

        const jsonEntity = _.cloneDeep(entity);

        if (!_.has(entity, __TYPE__)) {
          jsonEntity[__TYPE__] = entityRef.getTypeName();
        }
        jsonEntity[__ID__] = id;
        // jsonEntity.__id = jsonEntity._id + '';
        //
        // if (_.has(jsonEntity, '_id')) {
        //   jsonEntity.__id = jsonEntity._id + '';
        //   delete jsonEntity._id;
        // } else {
        //   jsonEntity.__id = idPropertyRefs.map(x => _.get(entity, x.name) + '').join('--');
        //   if (_.isEmpty(jsonEntity.__id)) {
        //     throw new Error(
        //       'no id could be generate for ' + entityName + ' with properties ' + idPropertyRefs.map(x => x.name).join(', '));
        //   }
        // }

        indices.push(entityRef.getIndexName());
        promises.push(client.index(<Index>{
          id: id,
          index: entityRef.getIndexName(),
          body: jsonEntity,
          ...preparedOpts
        }));
      }

      if (promises.length > 0) {
        let results = [];

        try {
          results = await Promise.all(promises);
        } catch (err) {
          this.error = err;
          Log.error('index save error', err, JSON.stringify(err.meta.body, null, 2));
        }

        if (!this.error) {
          if (options.passResults) {
            for (let i = 0; i < this.objects.length; i++) {
              if (results[i].body) {
                this.objects[i]['$index'] = results[i].body;
              }
            }
          }
          if (options.refresh && results.length > 0) {
            await client.indices.refresh({ index: _.uniq(indices) });
          }
        }
      }

    } catch (e) {
      this.error = e;
    } finally {
      await connection.close();
    }

    const result = this.isArray ? this.objects : this.objects.shift();
    await this.controller.getInvoker().use(IndexElasticApi).doAfterSave(result, this.error, this);

    if (this.error) {
      throw this.error;
    }

    return result;
  }


  prepare(object: T | T[]): T[] {
    let objs: T[] = [];
    if (_.isArray(object)) {
      objs = object;
    } else {
      objs.push(object);
    }
    return objs;
  }


  private async validate() {
    let valid = true;
    await Promise.all(_.map(this.objects, o => new DataContainer(o, IndexEntityRegistry.$())).map(async c => {
      valid = valid && await c.validate();
      c.applyState();
    }));
    return valid;
  }


}
