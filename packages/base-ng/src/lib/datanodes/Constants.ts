import { Observable } from 'rxjs';

// export const K_TOP_FIXED = 'top-fixed';
// export const K_FRAMED = 'framed';


export const K_DATA_UPDATE = 'data-update';
export const K_FRAME_UPDATE = 'frame-update';

export const K_REBUILD = 'rebuild';
export const K_RESET = 'reset';
export const K_INITIAL = 'initial';

export const K_INITIALIZE = 'initialize';
export const K_INSERT = 'insert';
export const K_APPEND = 'append';
export const K_REMOVE = 'remove';


export const K_$COUNT = '$count';

/**
 * States of view array
 */
export type T_VIEW_ARRAY_STATES =
  'initial' |
  'data-update' |
  'frame-update' |
  'reset' |
  'destroy' |
  'insert' |
  'append' |
  'remove';

/**
 * Query callback
 */
export type T_QUERY_CALLBACK<T> = (start: number, end: number, limit?: number) => Observable<T[] & { $count?: number }>;
