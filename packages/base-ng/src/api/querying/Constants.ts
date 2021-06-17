import {IDTGridOptions} from '../../datatable/IDTGridOptions';

export const DEFAULT_DT_GRID_OPTIONS: IDTGridOptions = {
  pagerId: 'page',
  enablePager: true,
  limit: 25,
  freeQueryBuilder: true
};


/**
 * Querying
 */

export type QUERY_MODE = 'aggregate' | 'query';
export type STORAGE_REQUEST_MODE = 'metadata' |  'get' | 'update' | 'save' | 'delete' | 'query' | 'aggregate' | 'update_by_condition' | 'delete_by_condition';

export const C_SKIP_BUILDS = 'skipBuilds';
export const C_RAW = 'raw';
export const C_LABEL = 'label';
export const C_$LABEL = '$label';
