import { assign, cloneDeep, defaults, get, has, isArray, isNull, isNumber, keys, uniq, uniqBy } from 'lodash';
import { C_DEFAULT, JsonUtils } from '@allgemein/base';
import { ClassType } from '@allgemein/schema-api';
import { ElasticEntityController } from '../ElasticEntityController';
import { IFindOp } from '@typexs/base/libs/storage/framework/IFindOp';
import { Config, NotYetImplementedError, StorageError, XS_P_$COUNT, XS_P_$LIMIT, XS_P_$OFFSET } from '@typexs/base';
import { IndexElasticApi } from '../../../api/IndexElastic.api';
import { ElasticMangoWalker, ES_DEFAULT_TERM_QUERY, ES_DEFAULT_TERM_QUERY_LIKE, IElasticQueryConfig } from '../ElasticMangoWalker';
import { IndexEntityRef } from '../../registry/IndexEntityRef';
import {
  __TYPE__,
  C_SEARCH_INDEX,
  ES_IDFIELD,
  XS_P_$AGGREGATION,
  XS_P_$FACETS,
  XS_P_$INDEX,
  XS_P_$MAX_SCORE,
  XS_P_$SCORE
} from '../../Constants';
import { IElasticFieldDef } from '../IElasticFieldDef';
import { IElasticFindOptions } from './IElasticFindOptions';
import { OpsHelper } from './OpsHelper';
import { ElasticUtils } from '../ElasticUtils';


export class FindOp<T> implements IFindOp<T> {

  readonly controller: ElasticEntityController;

  protected options: IElasticFindOptions;

  protected entityTypes: (Function | string | ClassType<T>)[];

  protected findConditions: any;

  protected error: Error = null;

  constructor(controller: ElasticEntityController) {
    this.controller = controller;
  }

  getNamespace(): string {
    return C_SEARCH_INDEX;
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
    this.entityTypes = isArray(entityType) ? entityType : [entityType];
    const indexEntityRefs = OpsHelper.getIndexTypes(this.controller, this.entityTypes);

    options = options || {};

    this.findConditions = findConditions;
    let results: T[] = null;

    defaults(options, <IElasticFindOptions>{
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


      if (findConditions) {
        if (this.options.rawQuery) {
          opts.body.query = findConditions;
        } else {
          // TODO check if options passed for query walker
          const queryOptions: IElasticQueryConfig = Config.get(
            ['elastic', 'queryPresets', this.options.assignPreset ? this.options.assignPreset : C_DEFAULT].join('.'),
            {
              assign: {
                $eq: ES_DEFAULT_TERM_QUERY,
                $like: ES_DEFAULT_TERM_QUERY_LIKE
              }
            });
          let assignData = null;
          if (this.options.assignPreset) {
            // check if configured presets are defined
            assignData = Config.get(['elastic', 'queryPresets', this.options.assignPreset].join('.'), null);
          } else if (this.options.assign) {
            // check if configured presets are defined
            assignData = this.options.assign;
          }

          if (assignData) {
            queryOptions.assign = assign(queryOptions.assign, cloneDeep(assignData));
          }

          const builder = new ElasticMangoWalker(fields, queryOptions);
          opts.body = assign(opts.body, builder.build(findConditions));
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
        if (!isNull(this.options.limit) && isNumber(this.options.limit)) {
          opts.size = this.options.limit;
        }

        if (!isNull(this.options.offset) && isNumber(this.options.offset)) {
          opts.from = this.options.offset;
        }

        if (!isNull(this.options.sort)) {
          const s: any[] = [];
          keys(this.options.sort).forEach(sortKey => {
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

      if (has(this.options, 'highlight')) {
        opts.body.highlight = this.options.highlight || {};
        this.options.passResults = true;
        if (!opts.body.highlight.fields) {
          opts.body.highlight.fields = {};
          fields.forEach(field => {
            opts.body.highlight.fields[field.name] = {};
          });
        }
      }

      let aggsMode = null;
      if (has(this.options, 'facets')) {
        aggsMode = 'facets';
        opts.body.aggs = {};

        keys(this.options.facets).forEach(key => {
          let aggInc = 0;
          const list = this.options.facets[key];
          for (const entry of list) {
            const name = get(entry, 'name', key + '_' + (aggInc++));
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

      if (has(this.options, 'aggs')) {
        aggsMode = 'aggs';
        opts.body.aggs = this.options.aggs;
      }

      let recordCount = 0;
      let maxScore = 0;
      const { body } = await client.search(opts);

      const failures = get(body, '_shards.failures', []);
      if (failures.length > 0) {
        const msg = failures.map((x: any) => `[${x.reason.caused_by.type}] error on index "${x.index}" ${x.reason.reason}`);
        const error = new StorageError(msg);
        error.set('failures', failures);
        throw error;
      }

      if (has(body, 'hits')) {
        const hits = body.hits;
        maxScore = hits.max_score;
        if (has(hits, 'total.value')) {
          recordCount = hits.total.value;
        }
        if (has(hits, 'hits')) {
          for (const hit of hits.hits) {
            const _source = hit._source;
            const _type = _source[__TYPE__];
            const _index = hit._index;
            let object = null;
            if (!this.options.raw && _type && _index) {
              const aliasName = ElasticUtils.aliasName(_index);
              const indexEntityRef = indexEntityRefs.find(x => x.getAliasName() === aliasName && x.getTypeName() === _type);
              if (indexEntityRef) {
                const correctedType = JsonUtils.correctTypes(_source);
                object = indexEntityRef.build<T>(correctedType, { createAndCopy: true });
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

      if (has(body, 'aggregations')) {
        if (aggsMode === 'facets') {
          results[XS_P_$FACETS] = [];
          keys(body.aggregations).forEach(name => {
            const facet = {
              name: name,
              values: get(body.aggregations, name + '.buckets', [])
            };
            results[XS_P_$FACETS].push(facet);
          });
        } else {
          results[XS_P_$AGGREGATION] = get(body, 'aggregations', null);
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


