import { ClassType } from '@allgemein/schema-api';
import { IUpdateOp } from '@typexs/base/libs/storage/framework/IUpdateOp';
import { ElasticEntityController } from '../ElasticEntityController';
import { IElasticUpdateOptions } from './IElasticUpdateOptions';
import { IndexElasticApi } from '../../../api/IndexElastic.api';
import { OpsHelper } from './OpsHelper';
import { IndexEntityRef } from '../../registry/IndexEntityRef';
import { IElasticFieldDef } from '../IElasticFieldDef';
import { ElasticMangoWalker } from '../ElasticMangoWalker';
import { C_SEARCH_INDEX } from '../../Constants';
import { get, isArray, uniq, uniqBy } from '@typexs/generic';


export class UpdateOp<T> implements IUpdateOp<T> {

  error: Error = null;

  readonly controller: ElasticEntityController;

  protected condition: any;

  protected update: any;

  protected entityTypes: (Function | string | ClassType<T>)[];

  protected options: IElasticUpdateOptions;

  constructor(controller: ElasticEntityController) {
    this.controller = controller;
  }

  getNamespace(): string {
    return C_SEARCH_INDEX;
  }

  getConditions() {
    return this.condition;
  }

  getUpdate() {
    return this.update;
  }


  getEntityType() {
    return this.entityTypes as any;
  }

  getEntityTypes() {
    return this.entityTypes;
  }

  getOptions() {
    return this.options;
  }

  getController(): ElasticEntityController {
    return this.controller;
  }

  async run(entityType: Function | string | ClassType<T> | (Function | string | ClassType<T>)[],
    condition: any,
    update: any,
    options?: IElasticUpdateOptions): Promise<number> {
    if (!condition) {
      throw new Error('condition for update selection is empty');
    }
    if (!update) {
      throw new Error('update is empty');
    }

    this.entityTypes = isArray(entityType) ? entityType : [entityType];
    this.condition = condition;
    this.update = update;
    await this.controller.getInvoker().use(IndexElasticApi).onOptions('update', options);
    this.options = options;

    const indexEntityRefs = OpsHelper.getIndexTypes(this.controller, this.entityTypes);

    let results: number = -1;
    await this.controller.getInvoker().use(IndexElasticApi).doBeforeUpdate(this);
    results = await this.doUpdate(indexEntityRefs);
    await this.controller.getInvoker().use(IndexElasticApi).doAfterUpdate(results, this.error, this);
    if (this.error) {
      throw this.error;
    }
    return results;
  }


  private async doUpdate(indexEntityRefs: IndexEntityRef[]): Promise<number> {
    const results: number = -1;
    const connection = await this.controller.connect();
    try {
      const client = connection.getClient();

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
        // type: typeNames.join(','),
        body: get(this.options, 'body', {})
      };


      if (this.options.rawQuery) {
        opts.body.query = this.condition;
      } else {
        const builder = new ElasticMangoWalker(fields);
        opts.body = builder.build(this.condition);
      }


      // let recordCount = 0;
      // let maxScore = 0;
      const { body } = await client.updateByQuery(opts);
      // if (has(body, 'hits')) {
      //   const hits = body.hits;
      //   maxScore = hits.max_score;
      //   if (has(hits, 'total.value')) {
      //     recordCount = hits.total.value;
      //   }
      //   if (has(hits, 'hits')) {
      //     for (const hit of hits.hits) {
      //       const _source = hit._source;
      //       const _type = _source.__type;
      //       const _index = hit._index;
      //       let object = null;
      //       if (!this.options.raw && _type && _index) {
      //         const indexEntityRef = indexEntityRefs.find(x => x.getIndexName() === _index && x.getTypeName() === _type);
      //         if (indexEntityRef) {
      //           object = indexEntityRef.build<T>(JsonUtils.correctTypes(_source));
      //         } else {
      //           object = _source;
      //         }
      //       } else {
      //         object = _source;
      //       }
      //       object[XS_P_$SCORE] = hit._score;
      //       results.push(object);
      //       if (this.options.passResults) {
      //         delete hit['_source'];
      //         object[XS_P_$INDEX] = hit;
      //       }
      //     }
      //   }
      // }
      //
      // if (has(body, 'aggregations')) {
      //   if (aggsMode === 'facets') {
      //     results[XS_P_$FACETS] = [];
      //      Object.keys(body.aggregations).forEach(name => {
      //       const facet = {
      //         name: name,
      //         values: get(body.aggregations, name + '.buckets', [])
      //       };
      //       results[XS_P_$FACETS].push(facet);
      //     });
      //   } else {
      //     results[XS_P_$AGGREGATION] = get(body, 'aggregations', null);
      //   }
      // }
      // results[XS_P_$MAX_SCORE] = maxScore;
      // results[XS_P_$COUNT] = recordCount;
      // results[XS_P_$OFFSET] = this.options.offset;
      // results[XS_P_$LIMIT] = this.options.limit;
    } catch (e) {
      this.error = e;
    } finally {
      await connection.close();

    }

    return results;
  }


  // /**
  //  * when returns -2 then affected is not supported, so update worked but how many records ware changes is not given back
  //  */
  // private async updateSql(): Promise<number> {
  //   const jsonPropertySupport = this.controller.storageRef.getSchemaHandler().supportsJson();
  //   let affected = -1;
  //   const connection = await this.controller.connect();
  //   try {
  //     let qb: UpdateQueryBuilder<T> = null;
  //     if (this.condition) {
  //       const builder = new TypeOrmSqlConditionsBuilder<T>
  //       (connection.getEntityManager(), this.entityRef, this.controller.getStorageRef(), 'update');
  //       builder.build(this.condition);
  //       qb = builder.getQueryBuilder() as UpdateQueryBuilder<T>;
  //       // qb.where(where);
  //     } else {
  //       qb = connection.manager
  //         .getRepository(this.entityRef.getClassRef().getClass())
  //         .createQueryBuilder().update() as UpdateQueryBuilder<T>;
  //     }
  //
  //     // TODO make this better currently Hacki hacki
  //     let hasUpdate = false;
  //     let updateData = null;
  //     if (has(this.update, '$set')) {
  //       updateData = this.update['$set'];
  //       hasUpdate = true;
  //     } else if (!isEmpty(this.update)) {
  //       updateData = this.update;
  //       hasUpdate = true;
  //     }
  //     affected = 0;
  //
  //     if (hasUpdate) {
  //
  //       if (!jsonPropertySupport) {
  //         convertPropertyValueJsonToString(this.entityRef, updateData);
  //       }
  //       qb.set(updateData);
  //
  //       if (has(this.options, 'limit')) {
  //         qb.limit(this.options['limit']);
  //       }
  //       const r = await qb.execute();
  //       affected = get(r, 'affected', -2);
  //     }
  //   } catch (e) {
  //     this.error = e;
  //   } finally {
  //     await connection.close();
  //
  //   }
  //   return affected;
  // }
  //
  //
  // private async updateMongo(): Promise<number> {
  //   let affected = -1;
  //   const connection = await this.controller.connect();
  //   try {
  //     const repo = connection.manager.getMongoRepository(this.entityRef.getClassRef().getClass());
  //
  //     if (this.condition) {
  //       TreeUtils.walk(this.condition, x => {
  //         if (x.key && isString(x.key)) {
  //           if (x.key === '$like') {
  //             x.parent['$regex'] = x.parent[x.key].replace('%%', '#$#').replace('%', '.*').replace('#$#', '%%');
  //           }
  //         }
  //       });
  //     }
  //
  //     const r = await repo.updateMany(this.condition, this.update, this.options);
  //     affected = r.modifiedCount;
  //   } catch (e) {
  //     this.error = e;
  //   } finally {
  //     await connection.close();
  //
  //   }
  //   return affected;
  // }

}


