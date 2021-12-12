import { IDataExchange } from '../IDataExchange';
import { IFindOptions } from '../IFindOptions';


export interface IFindData extends IDataExchange<any[]> {
  condition?: any;
  lookup?: any;
  join?: any[];
  map?: number[][];
  options?: IFindOptions;
  target?: any[];
}
