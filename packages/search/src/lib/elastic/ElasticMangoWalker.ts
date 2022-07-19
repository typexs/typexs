import * as _ from 'lodash';
import { get } from 'lodash';
import { AbstractCompare, And, IMangoWalker, MangoExpression, MultiArgs, Not, Or, PAst, PValue } from '@allgemein/mango-expressions';
import { IMangoWalkerControl } from '@allgemein/mango-expressions/IMangoWalker';
import { NotYetImplementedError } from '@typexs/base';
import { ES_ALLFIELD, ES_IDFIELD } from '../Constants';
import { IElasticFieldDef } from './IElasticFieldDef';

export interface IElasticQuery {
  [k: string]: any;
}


/**
 * Configuration options for elastic query like
 * - default text search
 */
export interface IElasticQueryAssign {

  $eq?: any;

  $like?: any;
}


/**
 * Configuration options for elastic query like
 * - default text search
 */
export interface IElasticQueryConfig {
  assign?: IElasticQueryAssign;

  [k: string]: any;

}

export const ES_DEFAULT_TERM_QUERY = {
  'operator': 'and',
  'minimum_should_match': 1,
  'analyzer': 'standard',
  'zero_terms_query': 'none',
  'lenient': false,
  'prefix_length': 0,
  'max_expansions': 50,
  'boost': 1
};

export const ES_DEFAULT_TERM_QUERY_LIKE = {
  'fuzziness': 'AUTO',
  'fuzzy_transpositions': true,
  'operator': 'and',
  'minimum_should_match': 1,
  'analyzer': 'standard',
  'zero_terms_query': 'none',
  'lenient': false,
  'prefix_length': 0,
  'max_expansions': 50,
  'boost': 1
};


export class ElasticMangoWalker implements IMangoWalker {

  must: any[] = [];

  should: any[] = [];

  filter: any[] = [];

  must_not: any[] = [];

  readonly fields: IElasticFieldDef[] = [];

  /**
   * Configuration
   */
  readonly config: IElasticQueryConfig = {};

  constructor(
    fields: IElasticFieldDef[] = [],
    config: IElasticQueryConfig = {
      assign: {
        $eq: ES_DEFAULT_TERM_QUERY,
        $like: ES_DEFAULT_TERM_QUERY_LIKE
      }
    }
  ) {
    this.fields = fields;
    this.config = config;
  }

  getFields(type?: string, additional = [ES_ALLFIELD, '_label']) {
    const fields: string[] = type ? this.fields
      .filter(x => x.type === type || x.esType === type)
      .map(x => x.name) : this.fields.map(x => x.name);
    return _.uniq(_.concat(additional, fields));
  }

  build(condition: any, k: string = null): IElasticQuery {
    if (_.isEmpty(condition)) {
      return null;
    }

    if (!(condition instanceof PAst)) {
      condition = new MangoExpression(condition).getRoot();
    }

    let brackets = condition.visit(this);

    if (_.isArray(brackets)) {
      if (brackets.length > 1) {
        this.must = brackets;
        brackets = null;
      } else {
        brackets = brackets.shift();
      }
    }


    if (_.isEmpty(brackets)) {
      if (this.must.length > 0 || this.should.length > 0 || this.must_not.length > 0 || this.filter.length > 0) {
        brackets = { bool: {} };
        if (this.must.length > 0) {
          brackets.bool.must = this.must;
        }
        if (this.should.length > 0) {
          brackets.bool.should = this.should;
        }
        if (this.must_not.length > 0) {
          brackets.bool.must_not = this.must_not;
        }
        if (this.filter.length > 0) {
          brackets.bool.filter = this.filter;
        }
      }
    }

    return { query: brackets };
  }


  onValue(ast: PAst, ctrl?: IMangoWalkerControl): any {
    if (ast instanceof PValue) {
      return ast.value;
    }
    return null;

  }

  /**
   * Enter an array object like [{a:{$eq:1}}, {b:{$eq:2}}]
   * @param ast
   * @param ctrl
   */
  visitArray(ast: PAst, ctrl?: IMangoWalkerControl): any[] {
    return [];
  }


  /**
   * Leave an array object like [{term:{a: {value: 1}}}, {term : {b:{value:2}}}]
   * @param ast
   * @param ctrl
   */
  leaveArray(res: any[], ast: PAst): any {
    // remove empty entries
    res = _.isArray(res) ? res.filter(x => !!x) : res;
    if (!_.isEmpty(res)) {
      if (_.isArray(res[0])) {
        // flatten
        return _.concat([], ...res);
      }
    }
    return res;
  }

  /**
   * Enter an object like {abc: {$eq: 'cdf'}}
   *
   * @param ast
   * @param ctrl
   */
  visitObject(ast: PAst, ctrl?: IMangoWalkerControl): any {
    return {};
  }

  /**
   * Leaving the transformed object {abc: {term: {abc: {value: 'cdf'}}}}
   *
   * @param res
   * @param ast
   */
  leaveObject(res: any, ast: PAst): any {
    return _.values(res);
  }

  /**
   * Entering an operator {$eq: 'asd'}
   *
   * @param ast
   * @param ctrl
   */
  visitOperator(ast: PAst, ctrl?: IMangoWalkerControl): any {
  }

  /**
   *
   *
   * @param res
   * @param ast
   */
  leaveOperator(res: any, ast: PAst, ctrl?: IMangoWalkerControl): any {
    if (ast instanceof And) {
      this.must.push(...res);
    } else if (ast instanceof Or) {
      this.should.push(...res);
    } else if (ast instanceof Not) {
      throw new NotYetImplementedError('not is todo');
    } else {
      throw new NotYetImplementedError('not is todo');
    }
  }


  onOperator(ast: PAst, valueRes: any, ctrl?: IMangoWalkerControl): any {
    if (ast instanceof AbstractCompare) {
      return this.handleOperation(ast.name, ast.key as string, valueRes, ast);
    }
    return null;
  }


  private handleOperation(op: string, key: string = null, value: any = null, ast: PAst = null) {
    if (this['$' + op]) {
      return this['$' + op](op, key, value, ast);
    }
    throw new NotYetImplementedError('op = ' + op + '; key = ' + key + '; value = ' + JSON.stringify(value));
  }


  private $eq(op: string, key: string = null, value: any = null, ast: PAst = null) {
    if (key === ES_ALLFIELD) {
      const termQuery = { multi_match: {} };
      termQuery.multi_match = {
        ...get(this.config, 'assign.$eq', ES_DEFAULT_TERM_QUERY),
        query: value,
        fields: this.getFields('text')
      };
      return termQuery;
    } else if (key === ES_IDFIELD) {
      const termQuery = { ids: {} };
      termQuery.ids = { values: _.isArray(value) ? value : [value] };
      return termQuery;
    } else if (_.isNumber(value)) {
      const termQuery = { range: {} };
      termQuery.range[key] = { gte: value, lte: value };
      return termQuery;
    } else {
      const termQuery = { term: {} };
      termQuery.term[key] = { value: value };
      return termQuery;

    }

  }

  private $like(op: string, key: string = null, value: any = null, ast: PAst = null) {
    if (key === ES_ALLFIELD) {
      const termQuery = { multi_match: {} };
      termQuery.multi_match = {
        ...get(this.config, 'assign.$like', ES_DEFAULT_TERM_QUERY_LIKE),
        query: value,
        fields: this.getFields('text')
      };
      return termQuery;
    } else {
      const termQuery = { match: {} };
      termQuery.match[key] = { query: value, operator: 'and' };
      return termQuery;

    }
  }

  private $regex(op: string, key: string = null, value: MultiArgs = null, ast: PAst = null) {
    const termQuery = { regexp: {} };
    termQuery.regexp[key] = { value: _.first(value.args), flags: 'ALL', 'case_insensitive': true };
    return termQuery;
  }

  private $lte(op: string, key: string = null, value: any = null, ast: PAst = null) {
    return this.$le(op, key, value, ast);
  }

  private $le(op: string, key: string = null, value: any = null, ast: PAst = null) {
    if (_.isNumber(value)) {
      const termQuery = { range: {} };
      termQuery.range[key] = { lte: value };
      return termQuery;
    }
    throw new NotYetImplementedError('');
  }

  private $lt(op: string, key: string = null, value: any = null, ast: PAst = null) {
    if (_.isNumber(value)) {
      const termQuery = { range: {} };
      termQuery.range[key] = { lt: value };
      return termQuery;
    }
    throw new NotYetImplementedError('');
  }

  private $gte(op: string, key: string = null, value: any = null, ast: PAst = null) {
    return this.$ge(op, key, value, ast);
  }

  private $ge(op: string, key: string = null, value: any = null, ast: PAst = null) {
    if (_.isNumber(value)) {
      const termQuery = { range: {} };
      termQuery.range[key] = { gte: value };
      return termQuery;
    }
    throw new NotYetImplementedError('');
  }

  private $gt(op: string, key: string = null, value: any = null, ast: PAst = null) {
    if (_.isNumber(value)) {
      const termQuery = { range: {} };
      termQuery.range[key] = { gt: value };
      return termQuery;
    }
    throw new NotYetImplementedError('');
  }

  private $in(op: string, key: string = null, value: any = null, ast: PAst = null) {
    if (_.isArray(value)) {
      if (key === ES_IDFIELD) {
        const termQuery = { ids: {} };
        termQuery.ids = { values: value };
        return termQuery;
      } else if (value.length > 0 && (_.isString(value[0]) || _.isNumber(value[0]))) {
        const termQuery = { terms: {} };
        termQuery.terms[key] = value;
        return termQuery;
      }
    }
    throw new NotYetImplementedError('');
  }

}
