// export const K_VIEW = 'view';

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
  'getControl',
  'getRows',
  'supportedModes'
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
