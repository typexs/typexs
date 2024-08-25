import { DatatableComponent } from './datatable.component';

/**
 * Variables from @typexs/base
 */
export const XS_P_$COUNT = '$count';
export const XS_P_$LIMIT = '$limit';
export const XS_P_$OFFSET = '$offset';
export const K_ENTITY_BUILT = '_built_';
export const C_SKIP_BUILDS = 'skipBuilds';
export const C_RAW = 'raw';
export const C_LABEL = 'label';
export const C_ENTITY_LABEL = 'entity_label';
export const C_$LABEL = '$label';
export const __DEFAULT__ = '__default__';


export const inputKeys: string[] = [
  '_nodes',
  '_gridControl$',
  'gridControl$',
  '_params',
  'options',
  'params',
  'passThrough',
  'columns',
  'maxRows',
  'rows',
  'limit',
  'offset',

];

export const outputKeys = [
  'doQuery',
  'gridReady',
  'paramsChange'
];

export const methodKeys = [
  'rebuild',
  'isInitialized',
  'getMaxRows',
  'setMaxRows',
  'getColumns',
  'setColumns',
  'getControl',
  'getControlObserver',
  'getRows',
  'setRows',
  'triggerControl',
  'getViewMode',
  'setViewMode',
  'supportedViewModes'
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
