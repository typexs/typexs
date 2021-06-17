import {IGridColumn} from './IGridColumn';
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {IDTGridOptions} from './IDTGridOptions';
import {IQueryParams} from './IQueryParams';
import {IGridApi} from './IGridApi';
import {Helper} from '../api/querying/Helper';

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
  options: IDTGridOptions;

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
