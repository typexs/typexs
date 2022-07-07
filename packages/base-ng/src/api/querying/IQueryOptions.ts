import { IDatatableOptions } from '../../datatable/IDatatableOptions';

export interface IQueryOptions extends IDatatableOptions {


  /**
   * Max entities to fetch
   */
  limit?: number;

  /**
   * Offset for fetching entities
   */
  offset?: number;

  /**
   * Sort for queried entities
   */
  sorting?: any;
  sort?: any;

  /**
   * Auto-query on component init (default will be true)
   */
  queryOnInit?: boolean;

  /**
   * TODO Description
   */
  columnsOverride?: boolean;
}
