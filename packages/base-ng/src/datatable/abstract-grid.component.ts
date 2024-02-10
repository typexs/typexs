import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { IGridColumn } from './IGridColumn';
import { IDatatableOptions } from './IDatatableOptions';
import { IQueryParams } from './IQueryParams';
import { IGridApi } from './IGridApi';
import { Helper } from '../api/querying/Helper';
import { GRID_MODE, K_PAGED } from './Constants';
import { GRID_EVENT_TYPE, IGridEvent } from './IGridEvent';
import { ViewArray } from '../lib/datanodes/ViewArray';
import { assign, defaults, isEmpty, isNumber } from 'lodash';
import { PagerService } from '../pager/PagerService';
import { Pager } from '../pager/Pager';
import { PagerAction } from '../pager/PagerAction';


@Component({
  template: ''
})
export class AbstractGridComponent implements IGridApi, OnInit, OnDestroy {

  /**
   * Node handling data structure
   *
   * @private
   */
  private _dataNodes: ViewArray<unknown> = new ViewArray<unknown>();

  /**
   * Pager object for handling page navigation
   */
  pager: Pager;

  /**
   *
   */
  private _pagerService: PagerService;

  /**
   * Reference to parent / called component
   */// eslint-disable-next-line no-use-before-define
  parent: AbstractGridComponent;

  _params: IQueryParams = {};

  private _changeRef: ChangeDetectorRef;

  @Input()
  get params() {
    return this._params;
  }

  set params(v: IQueryParams) {
    this._params = v;
    this.paramsChange.emit(this._params);
  }

  @Output()
  paramsChange: EventEmitter<IQueryParams> = new EventEmitter<IQueryParams>();

  @Input()
  options: IDatatableOptions;

  @Input()
  get maxRows(): number {
    return this.getMaxRows();
  }

  set maxRows(rows: number) {
    this.setMaxRows(rows);
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


  @Output()
  doQuery: EventEmitter<IGridApi> = new EventEmitter<IGridApi>();

  @Output()
  gridReady: EventEmitter<IGridEvent> = new EventEmitter<IGridEvent>();

  /**
   * Parameter which should be passed through
   */
  @Input()
  passThrough: { [propName: string]: any } = {};


  constructor(
    pagerService: PagerService,
    changeRef: ChangeDetectorRef
  ) {
    this._pagerService = pagerService;
    this._changeRef = changeRef;
    this.construct();
  }

  construct() {
  }

  ngOnInit(): void {
    this.initialize();
  }

  initialize() {
    if (!this.options) {
      this.options = {};
    }
    defaults(this.options, <IDatatableOptions>{
      enablePager: true,
      limit: 25,
      mode: K_PAGED
    });

    this.initPager();
    if (isEmpty(this.params)) {
      // if params not set set default values
      assign(this.params, {
        limit: this.options.limit,
        offset: 0
      });
    }

    // apply position options to parameters
    if (this.options.limit && this.limit !== this.options.limit) {
      this.limit = this.options.limit;
    }


    if (!this.maxRows && this.getDataNodes()) {
      // if maxRows is empty and rows already set then derive maxlines
      this.maxRows = this.getDataNodes().length;
    }

    this.calcOffset();

    if (this.isPagerEnabled()) {
      this.calcPager();
    }

  }

  private initPager() {
    // if pager enabled get a pager object
    if (this.isPagerEnabled()) {
      this.pager = this.getPagerService().get(this.options.pagerId);
    } else {
      this.options.enablePager = false;
    }

  }

  isPagerEnabled() {
    return this.getGridMode() === K_PAGED;
  }

  getPagerService() {
    return this._pagerService;
  }


  /**
   * Return grid component
   */
  getGridComponent(): AbstractGridComponent {
    return this;
  }

  /**
   * Return grid api
   */
  api(): IGridApi {
    return this.getGridComponent() as IGridApi;
  }


  /**
   * Return the current limit value
   */
  get limit(): number {
    return this.params.limit;
  }

  /**
   * Set the current limit and update data node
   * @param limit
   */
  set limit(limit: number) {
    this.params.limit = limit;
    this.getDataNodes().limit = limit;
  }

  /**
   * Return the current offset value
   */
  get offset(): number {
    return this.params.offset;
  }

  /**
   * Set the current limit and update data node
   * @param limit
   */
  set offset(offset: number) {
    this.params.offset = offset;
    this.getDataNodes().offset = offset;
  }

  getValues() {
    return this.getDataNodes().getValues();
  }

  getOptions() {
    return this.options;
  }


  /**
   * Method to check if grid mode is supported
   * @param name
   */
  supportedGridMode(name: GRID_MODE) {
    return true;
  }

  /**
   * Return grid row handling mode (@see GRID_MODE)
   */
  getGridMode() {
    return this.options?.mode;
  }


  /**
   * Return data nodes from local instance or the embedding one
   */
  getDataNodes(): ViewArray<any> {
    if (this.parent) {
      return this.parent.getDataNodes();
    }
    return this._dataNodes;
  }

  /**
   * Set data nodes on local instance or the embedding one
   */
  setDataNodes(nodes: any[]) {
    if (this.parent) {
      this.parent.setDataNodes(nodes);
    } else {
      this._dataNodes.clear();
      // this.onChangesUpdateQuery();
      this._dataNodes.maxRows = nodes.length;
      this._dataNodes.push(...nodes);
      this._dataNodes.calcView();
    }
  }


  onPagerAction(action: PagerAction) {
    if (action.name === this.options.pagerId && action.type === 'set') {
      this.offset = (action.page - 1) * this.options.limit;
      this.limit = this.options.limit;
      this.paramsChange.emit(this.params);
      this.doQuery.emit(this);
    }
  }


  /**
   * Return all rows
   */
  getRows(): any[] {
    return this.getDataNodes().map(x => x.data);
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
    this.setDataNodes(rows);
  }


  getMaxRows(): number {
    return this.getDataNodes().maxRows;
  }

  /**
   * Set max rows entry
   *
   * @param maxRows
   */
  setMaxRows(maxRows: number) {
    this.getDataNodes().maxRows = maxRows;
  }


  reset() {
    this.restPager();
    this.offset = 0;
    this.getDataNodes().calcView();
  }

  /**
   * TODO
   * Calculate offset; set offset = 0 when maxRows < limit
   */
  calcOffset() {
    const maxRows = this.getMaxRows();
    if (maxRows < this.limit) {
      this.offset = 0;
    }
  }

  rebuild() {
    this._changeRef.markForCheck();
    this._changeRef.detectChanges();
    this.initialize();
    // this.onChangesUpdateQuery();
    this.getDataNodes().calcView();
    this.emitEvent('rebuild');
  }


  getColumns(): IGridColumn[] {
    return this.columns;
  }

  setColumns(columns: IGridColumn[]) {
    this.columns = columns;
  }


  emitEvent(e: GRID_EVENT_TYPE, data?: any) {
    const event: IGridEvent = {
      event: e,
      api: this.getGridComponent() as IGridApi
    };
    if (data) {
      event.data = data;
    }
    this.gridReady.emit(event);
  }


  calcPager() {
    if (this.isPagerEnabled()) {
      if (this.params && isNumber(this.maxRows) && isNumber(this.limit)) {
        if (!this.params.offset) {
          this.offset = 0;
          this.paramsChange.emit(this.params);
        }
        this.pager.totalPages = Math.ceil(this.maxRows * 1.0 / this.limit * 1.0);

        if (!this.pager.checkQueryParam()) {
          this.pager.currentPage = (this.offset / this.limit) + 1;
          this.pager.calculatePages();
        }
      }
    }
  }

  restPager() {
    if (this.isPagerEnabled()) {
      this.pager.reset();
    }
  }


  ngOnDestroy(): void {
    if (this.options.enablePager && this.pager) {
      this.pager.free();
    }

  }


}
