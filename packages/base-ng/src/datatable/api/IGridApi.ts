import { IQueryParams } from './IQueryParams';
import { IGridColumn } from './IGridColumn';
import { ViewArray } from '../../lib/datanodes/ViewArray';
import { IGridMode } from './IGridMode';

export interface IGridApi {

  params: IQueryParams;

  // doInitialize(): void;

  /**
   * Which internal modes are supported by this grid type
   */
  supportedModes(): IGridMode[];

  getColumns(): IGridColumn[];

  setColumns(columns: IGridColumn[]): void;

  getRows(): any[];

  setRows(rows: any[]): void;

  getMaxRows(): number;

  setMaxRows(maxRows: number): void;

  getDataNodes(): ViewArray<any>;

  rebuild(): void;

  reset(): void;
}
