import {IQueryParams} from './IQueryParams';
import {IGridColumn} from './IGridColumn';

export interface IGridApi {

  params: IQueryParams;

  rebuild(): void;

  getColumns(): IGridColumn[];

  setColumns(columns: IGridColumn[]): void;

  getRows(): any[];

  setRows(rows: any[]): void;

  getMaxRows(): number;

  setMaxRows(maxRows: number): void;

  reset(): void;
}
