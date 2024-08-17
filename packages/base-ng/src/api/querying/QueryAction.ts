import {ExprDesc} from '@allgemein/expressions';
import {T_QUERY_MODE} from './Constants';


export class QueryAction {

  readonly mode: T_QUERY_MODE;

  /**
   * Mango-Query
   */
  readonly mango: ExprDesc;

  /**
   * Mango-Query as JSON
   */
  readonly query: any;

  constructor(q: any, mode: T_QUERY_MODE = 'query') {
    if (q instanceof ExprDesc) {
      this.mango = q;
      this.query = q.toJson();
    } else {
      this.query = q;
    }
  }


}
