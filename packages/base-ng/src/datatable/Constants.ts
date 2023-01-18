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

export const inputKeys = ['columns', 'rows', 'maxRows', 'options', 'params'];
export const outputKeys = ['doQuery', 'gridReady', 'paramsChange'];
export const methodKeys = ['rebuild', 'setMaxRows', 'setColumns', 'setRows', 'getMaxRows', 'getColumns', 'getRows'];

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
