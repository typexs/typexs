import { IGridColumn } from './IGridColumn';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IDatatableOptions } from './IDatatableOptions';
import { IQueryParams } from './IQueryParams';
import { IGridApi } from './IGridApi';
import { Helper } from '../api/querying/Helper';
import { GRID_MODE } from '@typexs/base-ng/datatable/Constants';


@Component({
  template: ''
})
export class AbstractGridComponent implements IGridApi {

  @Output()
  paramsChange: EventEmitter<IQueryParams> = new EventEmitter<IQueryParams>();

  _params: IQueryParams = {};

  @Input()
  get params() {
    return this._params;
  }

  set params(v: IQueryParams) {
    this._params = v;
    this.paramsChange.emit(this._params);
  }

  @Input()
  columns: IGridColumn[];

  @Input()
  rows: any[];

  @Input()
  maxRows: number;

  @Input()
  options: IDatatableOptions;

  @Output()
  doQuery: EventEmitter<IGridApi> = new EventEmitter<IGridApi>();

  @Output()
  gridReady: EventEmitter<any> = new EventEmitter<any>();

  constructor() {
    this.construct();
  }

  construct() {
  }

  rebuild() {
    this.gridReady.emit();
  }

  /**
   * Method to check if grid mode is supported
   * @param name
   */
  supportedGridMode(name: GRID_MODE) {
    return true;
  }

  getGridMode() {
    return this.options.mode;
  }

  setRows(rows: any[]) {
    if (!this.columns) {
      this.setColumns(Helper.rebuildColumns(rows));
    }
    this.rows = rows;
  }


  setColumns(columns: IGridColumn[]) {
    this.columns = columns;
  }

  setMaxRows(maxRows: number) {
    this.maxRows = maxRows;
  }

  reset() {
    this.params.offset = 0;
  }

  getColumns(): IGridColumn[] {
    return this.columns;
  }

  getMaxRows(): number {
    return this.maxRows;
  }

  getRows(): any[] {
    return this.rows;
  }


}
