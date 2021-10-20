import * as _ from 'lodash';
import { JsonUtils } from '@allgemein/base';
import { ClassType } from '@allgemein/schema-api';
import { ElasticEntityController } from '../ElasticEntityController';
import { IFindOp } from '@typexs/base/libs/storage/framework/IFindOp';
import { NotYetImplementedError, XS_P_$COUNT, XS_P_$LIMIT, XS_P_$OFFSET } from '@typexs/base';
import { IndexElasticApi } from '../../../api/IndexElastic.api';
import { ElasticMangoWalker } from '../ElasticMangoWalker';
import { IndexEntityRef } from '../../registry/IndexEntityRef';
import { __TYPE__, ES_IDFIELD, XS_P_$AGGREGATION, XS_P_$FACETS, XS_P_$INDEX, XS_P_$MAX_SCORE, XS_P_$SCORE } from '../../Constants';
import { IElasticFieldDef } from '../IElasticFieldDef';
import { IElasticFindOptions } from './IElasticFindOptions';
import { OpsHelper } from './OpsHelper';


export class FindOp<T> implements IFindOp<T> {

  readonly controller: ElasticEntityController;

  protected options: IElasticFindOptions;

  protected entityTypes: (Function | string | ClassType<T>)[];

  protected findConditions: any;

  protected error: Error = null;

  constructor(controller: ElasticEntityController) {
    this.controller = controller;
  }

  getFindConditions() {
    return this.findConditions;
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

  /**
   * Allow wildcard for search over all
   *
   * @param entityType
   * @param findConditions
   * @param options
   */
  async run(
    entityType: Function | string | ClassType<T> | (Function | string | ClassType<T>)[],
    findConditions?: any,
    options?: IElasticFindOptions): Promise<T[]> {
    this.entityTypes = _.isArray(entityType) ? entityType : [entityType];
    const indexEntityRefs = OpsHelper.getIndexTypes(this.controller, this.entityTypes);

    options = options || {};

    this.findConditions = findConditions;
    let results: T[] = null;

    _.defaults(options, <IElasticFindOptions>{
      limit: 50,
      offset: null,
      sort: null,
      cache: false,
      passResults: false,
      raw: false,
      rawQuery: false,
      onEmptyConditions: 'match_all'
    });

    await this.controller.getInvoker().use(IndexElasticApi).onOptions('find', options);
    this.options = options;
    await this.controller.getInvoker().use(IndexElasticApi).doBeforeFind(this);
    results = await this.find(indexEntityRefs, findConditions);
    await this.controller.getInvoker().use(IndexElasticApi).doAfterFind(results, this.error, this);

    if (this.error) {
      throw this.error;
    }

    return results;
  }


  private async find(indexEntityRefs: IndexEntityRef[], findConditions?: any): Promise<T[]> {
    const results: T[] = [];
    const connection = await this.controller.connect();
    try {
      const client = connection.getClient();

      let indexNames = [];
      let fields: IElasticFieldDef[] = [];

      for (const i of indexEntityRefs) {
        indexNames.push(i.getIndexName());
        fields.push(...this.controller.getStorageRef().getFields()
          .filter(x => x.indexName === i.getIndexName() && x.typeName === i.getTypeName()));
      }

      indexNames = _.uniq(indexNames);
      fields = _.uniqBy(fields, x => JSON.stringify(x));
      const opts: any = {
        index: indexNames,
        // type: typeNames.join(','),
        body: _.get(this.options, 'body', {})
      };


      if (findConditions) {
        if (this.options.rawQuery) {
          opts.body.query = findConditions;
        } else {
          const builder = new ElasticMangoWalker(fields);
          // const builder = new ElasticMangoWalker();
          opts.body = _.assign(opts.body, builder.build(findConditions));

        }
      } else {
        if (this.options.onEmptyConditions) {
          switch (this.options.onEmptyConditions) {
          case 'match_all':
            opts.body.query = { match_all: {} };
            break;
          case 'match_none':
            opts.body.query = { match_none: {} };
            break;
          }
        }
      }

      if (opts.body.query) {
        // do this only when query present
        if (!_.isNull(this.options.limit) && _.isNumber(this.options.limit)) {
          opts.size = this.options.limit;
        }

        if (!_.isNull(this.options.offset) && _.isNumber(this.options.offset)) {
          opts.from = this.options.offset;
        }

        if (!_.isNull(this.options.sort)) {
          const s: any[] = [];
          _.keys(this.options.sort).forEach(sortKey => {
            const _sort = {};
            const v = this.options.sort[sortKey];
            _sort[sortKey] = v.toLocaleLowerCase();
            s.push(_sort);
          });
          opts.body.sort = s;
        }
      } else {
        // run without query
        opts.size = 0;
      }

      if (_.has(this.options, 'highlight')) {
        opts.body.highlight = this.options.highlight || {};
        this.options.passResults = true;
        if (!opts.body.highlight.fields) {
          opts.body.highlight.fields = {};
          fields.forEach(field => {
            // const f = {};
            // f[field.name] = {};
            opts.body.highlight.fields[field.name] = {};
          });
        }
      }

      let aggsMode = null;
      if (_.has(this.options, 'facets')) {
        aggsMode = 'facets';
        opts.body.aggs = {};

        _.keys(this.options.facets).forEach(key => {
          let aggInc = 0;
          const list = this.options.facets[key];
          for (const entry of list) {
            const name = _.get(entry, 'name', key + '_' + (aggInc++));
            const type = entry.type;
            if (type === 'value') {
              opts.body.aggs[name] = {
                'terms': {
                  'field': key
                }
              };
            } else if (type === 'range') {
              throw new NotYetImplementedError('');
            }
          }
        });
      }

      if (_.has(this.options, 'aggs')) {
        aggsMode = 'aggs';
        opts.body.aggs = this.options.aggs;
      }

      let recordCount = 0;
      let maxScore = 0;
      const { body } = await client.search(opts);
      if (_.has(body, 'hits')) {
        const hits = body.hits;
        maxScore = hits.max_score;
        if (_.has(hits, 'total.value')) {
          recordCount = hits.total.value;
        }
        if (_.has(hits, 'hits')) {
          for (const hit of hits.hits) {
            const _source = hit._source;
            const _type = _source[__TYPE__];
            const _index = hit._index;
            let object = null;
            if (!this.options.raw && _type && _index) {
              const indexEntityRef = indexEntityRefs.find(x => x.getIndexName() === _index && x.getTypeName() === _type);
              if (indexEntityRef) {
                const correctedType = JsonUtils.correctTypes(_source);
                // if (!_.has(_source, '_id')) {
                //   object = indexEntityRef.build<T>(correctedType);
                // } else {
                object = indexEntityRef.build<T>(correctedType, { createAndCopy: true });
                // }
              }
            }
            if (!object) {
              object = _source;
            }
            object[ES_IDFIELD] = hit[ES_IDFIELD];
            object[XS_P_$SCORE] = hit['_score'];
            results.push(object);
            if (this.options.passResults) {
              delete hit['_source'];
              object[XS_P_$INDEX] = hit;
            }
          }
        }
      }

      if (_.has(body, 'aggregations')) {
        if (aggsMode === 'facets') {
          results[XS_P_$FACETS] = [];
          _.keys(body.aggregations).forEach(name => {
            const facet = {
              name: name,
              values: _.get(body.aggregations, name + '.buckets', [])
            };
            results[XS_P_$FACETS].push(facet);
          });
        } else {
          results[XS_P_$AGGREGATION] = _.get(body, 'aggregations', null);
        }
      }
      results[XS_P_$MAX_SCORE] = maxScore;
      results[XS_P_$COUNT] = recordCount;
      results[XS_P_$OFFSET] = this.options.offset;
      results[XS_P_$LIMIT] = this.options.limit;
    } catch (e) {
      this.error = e;
    } finally {
      await connection.close();

    }

    return results;
  }

}


