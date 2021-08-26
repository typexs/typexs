import { IDataExchange } from '../IDataExchange';

export interface ISaveData extends IDataExchange<any[]> {
  join?: any[];
  map?: number[][];
  target?: any[];
}
