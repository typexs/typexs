import {ExprDesc} from '@allgemein/expressions';

export interface IQueryParams {

  /**
   * Passing datatable specific filters
   */
  filters?: { [column: string]: ExprDesc };

  /**
   * Passing datatable specific field sorts
   */
  sorting?: { [column: string]: 'asc' | 'desc' };

  /**
   * Passing datatable demanded offset
   */
  offset?: number;

  /**
   * Passing datatable record limit
   */
  limit?: number;
}
