import { IGridColumn } from './IGridColumn';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IDatatableOptions } from './IDatatableOptions';
import { IQueryParams } from './IQueryParams';
import { IGridApi } from './IGridApi';
import { Helper } from '../api/querying/Helper';
import { ClassType, GRID_MODE } from './Constants';
import { GRID_EVENT_TYPE, IGridEvent } from './IGridEvent';
import { DataNode } from './DataNode';
import { isEmpty } from 'lodash';


@Component({
  template: ''
})
export class AbstractGridComponent implements IGridApi {


  @Output()
  paramsChange: EventEmitter<IQueryParams> = new EventEmitter<IQueryParams>();

  _params: IQueryParams = {};

  _dataNodes: DataNode<any>[] = [];

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
  get rows() {
    return this.getRows();
  }

  set rows(entries: any) {
    this.setRows(entries);
  }

  @Input()
  maxRows: number;

  @Input()
  options: IDatatableOptions;

  @Output()
  doQuery: EventEmitter<IGridApi> = new EventEmitter<IGridApi>();

  @Output()
  gridReady: EventEmitter<IGridEvent> = new EventEmitter<IGridEvent>();

  /**
   * Parameter which should be passed through
   */
  @Input()
  passThrough: { [propName: string]: any } = {};

  /**
   * Reference to parent / called component
   */
  parent: AbstractGridComponent;

  constructor() {
    this.construct();
  }

  construct() {

  }

  getOptions() {
    return this.options;
  }

  rebuild() {
    this.emitEvent('rebuild');
  }

  /**
   * Method to check if grid mode is supported
   * @param name
   */
  supportedGridMode(name: GRID_MODE) {
    return true;
  }

  getGridMode() {
    return this.options?.mode;
  }

  /**
   * Return all rows
   */
  getRows(): any[] {
    return this._dataNodes.map(x => x.data);
  }

  /**
   * Set rows by passing array with data; there will be enveloped in DateNode objects
   *
   * @param rows: any[]
   */
  setRows(rows: any[]) {
    if (!this.columns) {
      this.setColumns(Helper.rebuildColumns(rows));
    }

    let idx = this.getLastRowIdx();
    const dataNodes = rows.map(x => new DataNode(x, idx++));
    this._dataNodes = dataNodes;
  }


  /**
   * Get the first row index
   */
  getFirstRowIdx() {
    return isEmpty(this._dataNodes) ? 0 : this._dataNodes[0].idx;
  }


  /**
   * Get the last row index
   */
  getLastRowIdx() {
    return isEmpty(this._dataNodes) ? 0 : this._dataNodes[this._dataNodes.length - 1].idx;
  }


  getMaxRows(): number {
    return this.maxRows;
  }

  /**
   * Set max rows entry
   *
   * @param maxRows
   */
  setMaxRows(maxRows: number) {
    this.maxRows = maxRows;
  }

  reset() {
    this.params.offset = 0;
  }

  getColumns(): IGridColumn[] {
    return this.columns;
  }

  setColumns(columns: IGridColumn[]) {
    this.columns = columns;
  }

  api(): AbstractGridComponent {
    return this;
  }


  emitEvent(e: GRID_EVENT_TYPE, data?: any) {
    const event: IGridEvent = {
      event: e,
      api: this.api()
    };
    if (data) {
      event.data = data;
    }
    this.gridReady.emit(event);
  }
}
