import { IGridApi } from './IGridApi';


export type GRID_EVENT_TYPE = 'ready' | 'refresh' | 'rebuild' | 'update' | 'create' | 'remove' | 'requery';

export interface IGridEvent {
  event: GRID_EVENT_TYPE;

  api: IGridApi;

  data?: any;


}
