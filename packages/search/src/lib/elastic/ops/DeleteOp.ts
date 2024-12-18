import { assign, defaults, get, isArray, isEmpty, isFunction, uniq, uniqBy } from '@typexs/generic';


import { ClassType } from '@allgemein/schema-api';
import { IDeleteOp } from '@typexs/base/libs/storage/framework/IDeleteOp';
import { ElasticEntityController } from '../ElasticEntityController';
import { IElasticDeleteOptions } from './IElasticDeleteOptions';
import { IndexElasticApi } from '../../../api/IndexElastic.api';
import { OpsHelper } from './OpsHelper';
import { ElasticUtils } from '../ElasticUtils';
import { ClassUtils } from '@allgemein/base';
import { ElasticMangoWalker } from '../ElasticMangoWalker';
import { IElasticFieldDef } from '../IElasticFieldDef';
import { C_SEARCH_INDEX } from '../../Constants';


export class DeleteOp<T> implements IDeleteOp<T> {

  readonly controller: ElasticEntityController;

  error: Error = null;

  private objects: any[] = [];


  protected removable: T[] | T | ClassType<T>;

  protected conditions: any;

  protected options: IElasticDeleteOptions;

  constructor(controller: ElasticEntityController) {
    this.controller = controller;
  }

  getNamespace(): string {
    return C_SEARCH_INDEX;
  }


  getRemovable() {
    return this.removable;
  }

  getOptions() {
    return this.options;
  }

  getConditions() {
    return this.conditions;
  }

  getController(): ElasticEntityController {
    return this.controller;
  }

  async run(object: T[] | T | ClassType<T>,
    conditions: any = null,
    options: IElasticDeleteOptions = {}): Promise<number> {
    this.removable = object;
    this.conditions = conditions;
    defaults(options, {
      refresh: true
    });
    await this.controller.getInvoker().use(IndexElasticApi).onOptions('remove', options);
    this.options = options;

    await this.controller.getInvoker().use(IndexElasticApi).doBeforeRemove(this);

    let results: number = null;
    if (isFunction(object)) {
      results = await this.removeByCondition(<ClassType<T>>object, conditions, options);
    } else {
      results = await this.remove(<T | T[]>object, options);
    }

    await this.controller.getInvoker().use(IndexElasticApi).doAfterRemove(results, this.error, this);

    if (this.error) {
      throw this.error;
    }

    return results;
  }

  private async removeByCondition(object: ClassType<T>, condition: any,
    options: IElasticDeleteOptions = {}) {
    if (!condition) {
      throw new Error('condition for update selection is empty');
    }
    let count = -1;
    count = -1;
    const connection = await this.controller.connect();
    try {
      const indices: string[] = [];
      const client = connection.getClient();
      const indexEntityRefs = OpsHelper.getIndexTypes(this.controller, [object]);

      let indexNames = [];
      let fields: IElasticFieldDef[] = [];
      for (const i of indexEntityRefs) {
        indexNames.push(i.getAliasName());
        fields.push(...this.controller.getStorageRef().getFields()
          .filter(x => x.indexName === i.getAliasName() && x.typeName === i.getTypeName()));
      }

      indexNames = uniq(indexNames);
      fields = uniqBy(fields, x => JSON.stringify(x));
      const opts: any = {
        index: indexNames,
        body: get(this.options, 'body', {})
      };

      if (this.options.rawQuery) {
        opts.body.query = condition;
      } else {
        if (!isEmpty(condition)) {
          const builder = new ElasticMangoWalker(fields);
          opts.body = assign(opts.body, builder.build(condition));
        } else {
          opts.body.query = {
            match_all: {}
          };
        }
      }

      const results = await client.deleteByQuery(opts);
      count = get(results, 'body.deleted', 0);
      if (this.options.refresh) {
        await client.indices.refresh({ index: uniq(indices) });
      }

    } catch (e) {
      this.error = e;
    } finally {
      if (connection) {
        await connection.close();
      }
    }
    return count;
  }

  private async remove(object: T[] | T, options: IElasticDeleteOptions = {}) {
    const _isArray = isArray(object);
    const connection = await this.controller.connect();
    // let promiseResults: any[][] = null;
    let affected = -1;
    affected = -1;
    try {
      const indices: string[] = [];
      const client = connection.getClient();
      this.objects = this.prepare(object);
      const resolvedEntities = ElasticUtils.resolveByClassName(this.objects);
      const indexTypes = OpsHelper.getIndexTypes(this.controller,  Object.keys(resolvedEntities));
      const promises = [];
      for (const e of this.objects) {
        const className = ClassUtils.getClassName(e);
        const indexType = indexTypes.find(x => x.getEntityRef().name === className);
        const id = OpsHelper.getId(indexType, e);
        promises.push(client.delete({
          index: indexType.getAliasName(),
          id: id
        }));
        indices.push(indexType.getAliasName());
      }

      const results = await Promise.all(promises);
      affected = results.map(x => x.body).reduce((p, c) => c.result === 'deleted' ? ++p : p, 0);

      if (this.options.refresh) {
        await client.indices.refresh({ index: uniq(indices) });
      }

      // TODO refresh?

    } catch (e) {
      this.error = e;
    } finally {
      await connection.close();
    }

    if (!_isArray) {
      return this.objects.shift();
    }

    return affected;

  }


  private prepare(object: T | T[]): T[] {
    let objs: T[] = [];
    if (isArray(object)) {
      objs = object;
    } else {
      objs.push(object);
    }
    return objs;
  }


}
