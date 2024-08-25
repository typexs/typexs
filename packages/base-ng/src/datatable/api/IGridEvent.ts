import { IGridApi } from './IGridApi';


export type GRID_EVENT_TYPE = 'ready' | 'refresh' | 'rebuild' | 'update' | 'create' | 'remove' | 'requery' | 'initialized' | 'reset';

export interface IGridEvent {
  event?: GRID_EVENT_TYPE | string;

  /**
   * Signals if something changed
   */
  change?: string;

  api?: IGridApi;

  data?: any;


}
