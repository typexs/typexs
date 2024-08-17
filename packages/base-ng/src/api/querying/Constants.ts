import { IQueryOptions } from './IQueryOptions';

import { K_PAGED } from '../../datatable/api/IGridMode';

export const DEFAULT_QUERY_OPTIONS: IQueryOptions = {
  mode: K_PAGED,
  pagerId: 'page',
  enablePager: true,
  limit: 25,
  freeQueryBuilder: true,
  queryOnInit: true
};


export const K_QUERY = 'query';
export const K_AGGREGATE = 'aggregate';

/**
 * Querying
 */

export type T_QUERY_MODE =
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


