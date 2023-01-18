import { IDatatableOptions } from '../../datatable/IDatatableOptions';
import { IGridEvent } from '../../datatable/IGridEvent';
import { IQueryComponentApi } from './IQueryComponentApi';

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

  /**
   * Sort for queried entities
   * (same as sorting)
   */
  sort?: any;

  /**
   * Auto-query on component init (default will be true)
   */
  queryOnInit?: boolean;

  /**
   * TODO Description
   */
  columnsOverride?: boolean;

  /**
   * Callback for handle additional events, if return false then further processing is aborted
   *
   * @param event
   */
  eventHandle?: (event: IGridEvent, api: IQueryComponentApi) => boolean;
}
