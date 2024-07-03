import { IQueryParams } from './IQueryParams';
import { IGridColumn } from './IGridColumn';
import { ViewArray } from '../../lib/datanodes/ViewArray';
import { IGridMode } from './IGridMode';
import { BehaviorSubject } from 'rxjs';

export interface IGridApi {

  params: IQueryParams;

  /**
   * Which internal modes are supported by this grid type
   */
  supportedViewModes(): IGridMode[];

  /**
   * Return the current view mode
   */
  getViewMode(): string;

  /**
   * Set the current view mode
   *
   * @param viewMode
   */
  setViewMode(viewMode: string): void;

  getColumns(): IGridColumn[];

  setColumns(columns: IGridColumn[]): void;

  getRows(): any[];

  setRows(rows: any[]): void;

  getMaxRows(): number;

  setMaxRows(maxRows: number): void;

  getDataNodes(): ViewArray<any>;

  getControl(): BehaviorSubject<any>;

  rebuild(): void;

  reset(): void;
}
