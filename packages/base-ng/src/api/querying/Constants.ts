import { IQueryOptions } from './IQueryOptions';
import { K_PAGED } from '../../datatable/Constants';

export const DEFAULT_QUERY_OPTIONS: IQueryOptions = {
  mode: K_PAGED,
  pagerId: 'page',
  enablePager: true,
  limit: 25,
  freeQueryBuilder: true,
  queryOnInit: true
};


/**
 * Querying
 */

export type QUERY_MODE =
  'aggregate' |
  'query';

export type STORAGE_REQUEST_MODE =
  'metadata' |
  'get' |
  'update' |
  'save' |
  'delete' |
  'query' |
  'aggregate' |
  'update_by_condition' |
  'delete_by_condition';


