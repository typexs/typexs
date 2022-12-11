import { IGridApi } from './IGridApi';


export interface IGridEvent {
  event: 'ready' | 'refresh' | 'rebuild' | 'update' | 'create' | 'remove';

  api: IGridApi;

  data?: any;
}
