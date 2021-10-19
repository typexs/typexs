import {ExprDesc} from 'commons-expressions/browser';

export type QUERY_MODE = 'query' | 'aggregate';

export class QueryAction {

  readonly mode: QUERY_MODE;

  /**
   * Mango-Query
   */
  readonly mango: ExprDesc;

  /**
   * Mango-Query as JSON or Plain text
   */
  readonly query: any;

  constructor(q: any, mode: QUERY_MODE = 'query') {
    if (q instanceof ExprDesc) {
      this.mango = q;
      this.query = q.toJson();
    } else {
      this.query = q;
    }
  }


}
