import { IQueryParams } from './IQueryParams';
import { IGridColumn } from './IGridColumn';
import { ViewArray } from '../../lib/datanodes/ViewArray';
import { IGridMode } from './IGridMode';
import { BehaviorSubject } from 'rxjs';
import { GRID_EVENT_TYPE, IGridEvent } from './IGridEvent';

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

  getNodes(): ViewArray<any>;

  getControl(): BehaviorSubject<any>;

  isInitialized(): boolean;

  triggerControl(e: GRID_EVENT_TYPE | string, changeKey?: string, data?: any): void;

  rebuild(event?: IGridEvent): void;

  reset(): void;
}
