import { IQueryParams } from './IQueryParams';
import { IGridColumn } from './IGridColumn';
import { ViewArray } from '../lib/datanodes/ViewArray';

export interface IGridApi {

  params: IQueryParams;

  // limit: number;

  getColumns(): IGridColumn[];

  setColumns(columns: IGridColumn[]): void;

  getRows(): any[];

  setRows(rows: any[]): void;

  getMaxRows(): number;

  setMaxRows(maxRows: number): void;

  getDataNodes(): ViewArray<any>[];

  rebuild(): void;

  reset(): void;
}
