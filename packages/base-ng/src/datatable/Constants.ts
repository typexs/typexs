export const K_PAGED = 'paged';
export const K_INFINITE = 'infinite';
export const K_VIEW = 'view';
// export const K_VIEW = 'view';

/**
 * - paged - a pager will be integrated in the view
 * - infinite - an infinite scoll with reload on page bottom reach
 * - view - show only the once loaded rows
 */
export type GRID_MODE = 'paged' | 'infinite' | 'view';

/**
 * List with supported grid modes
 */
export const GRID_MODES = [
  { key: K_VIEW, label: K_VIEW },
  { key: K_PAGED, label: K_PAGED },
  { key: K_INFINITE, label: K_INFINITE }
];

export const inputKeys = [
  'options',
  'params',
  'passThrough',
  'columns',
  'maxRows',
  'rows',
  'limit'
];

export const outputKeys = [
  'doQuery',
  'gridReady',
  'paramsChange'
];

export const methodKeys = [
  'rebuild',
  'setMaxRows',
  'setColumns',
  'setRows',
  'getMaxRows',
  'getColumns',
  'getRows'
];

/**
 * Define class type for a constructor function
 */
export declare type ClassType<T> = new (...args: any[]) => T;

/**
 * Event types names
 */
export const Q_EVENT_TYPE_REBUILD = 'rebuild';
export const Q_EVENT_TYPE_REFRESH = 'refresh';
export const Q_EVENT_TYPE_REQUERY = 'requery';
