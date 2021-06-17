import {ExprDesc} from '@allgemein/expressions';
import {QUERY_MODE} from './Constants';


export class QueryAction {

  readonly mode: QUERY_MODE;

  /**
   * Mango-Query
   */
  readonly mango: ExprDesc;

  /**
   * Mango-Query as JSON
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
