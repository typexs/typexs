import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { IGridColumn } from './IGridColumn';
import { IDatatableOptions } from './IDatatableOptions';
import { IQueryParams } from './IQueryParams';
import { IGridApi } from './IGridApi';
import { Helper } from '../../api/querying/Helper';
import { GRID_EVENT_TYPE, IGridEvent } from './IGridEvent';
import { ViewArray } from '../../lib/datanodes/ViewArray';
import { assign, defaults, isEmpty, isNumber } from 'lodash';
import { PagerService } from '../../pager/PagerService';
import { PagerAction } from '../../pager/PagerAction';
import { K_DATA_UPDATE, K_FRAME_UPDATE, K_INITIAL, K_RESET, T_QUERY_CALLBACK, T_VIEW_ARRAY_STATES } from '../../lib/datanodes/Constants';
import { Subscription } from 'rxjs';
import { IGridMode, K_PAGED, K_VIEW, T_GRID_MODE } from './IGridMode';
import { Pager } from '../../pager/Pager';
import { first } from 'rxjs/operators';


@Component({
  template: ''
})
export class AbstractGridComponent implements IGridApi, OnInit, OnDestroy {

  /**
   * Node handling data structure
   *
   * @private
   */
  private _dataNodes: ViewArray<any> = new ViewArray<any>();

  /**
   * Pager object for handling page navigation
   */
  private _pager: Pager;

  /**
   * PagerSerivce
   */
  private _pagerService: PagerService;

  /**
   * Reference to parent / called component
   */// eslint-disable-next-line no-use-before-define
  parent: AbstractGridComponent;

  _params: IQueryParams = {};

  private _changeRef: ChangeDetectorRef;

  @Input()
  get params(): IQueryParams {
    const spanParams: IQueryParams = {
      offset: this.getDataNodes().offset,
      limit: this.getDataNodes().limit
    };
    const params = {};
    assign(params, this._params, spanParams);
    return params;
  }

  set params(v: IQueryParams) {
    if (typeof v.limit === 'number') {
      this.limit = v.limit;
    }
    if (typeof v.offset === 'number') {
      this.offset = v.offset;
    }
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

  set rows(entries: any[]) {
    this.setRows(entries);
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
   * Cache subscriptions
   */
  subscriptions: Subscription[] = [];


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

  /**
   * Return supported grid types, default returns only simple view mode
   */
  supportedModes(): IGridMode[] {
    return [
      { name: K_VIEW, label: K_VIEW }
    ];
  }

  /**
   * Register function for retrieving data by position
   *
   * @param fn
   */
  registerQueryCallback(fn: T_QUERY_CALLBACK<any>) {
    this.getDataNodes().setNodeCallback(fn);
  }

  /**
   * Impl. of ng OnInit interface
   */
  ngOnInit(): void {
    this.initialize();
  }


  applyOptions() {
    if (!this.options) {
      this.options = {};
    }
    defaults(this.options, <IDatatableOptions>{
      enablePager: true,
      limit: 25,
      mode: K_PAGED,
      pagerId: 'page'
    });

    if (isEmpty(this.params)) {
      // if params not set set default values
      this.limit = this.options.limit;
      this.offset = 0;
    }

    // apply position options to parameters
    if (this.options.limit && this.limit !== this.options.limit) {
      this.limit = this.options.limit;
    }

    if (this.getOptions().queryCallback) {
      this.registerQueryCallback(this.getOptions().queryCallback);
    }
  }

  /**
   * Called by ngOnInit
   */
  initialize() {
    this.applyOptions();

    // set mode
    this.getDataNodes().setFrameMode(this.getGridModeName());
    // const sub = this.getDataNodes().getNodeValues()
    //   .subscribe(this.onDataNodes.bind(this));
    // this.subscriptions.push(sub);

    // if (!this.maxRows && this.getDataNodes()) {
    //   // if maxRows is empty and rows already set then derive maxlines
    //   // this.maxRows = this.getDataNodes().maxRows;
    // }

    this.calcOffset();
    this.initPager();
    this.calcPager();

    const sub = this._dataNodes
      .getState().subscribe(this.onArrayState.bind(this));
    this.subscriptions.push(sub);
    // this.gridReady.subscribe(x => {
    //   if (x.event === 'initialized') {
    //     this.doInitialize();
    //   }
    // });
    this.doInitialize();
  }

  onArrayState(state: T_VIEW_ARRAY_STATES) {
    if (state === K_INITIAL) {
    } else if (state === K_FRAME_UPDATE) {
      // frame update is fired on change of view by limit change or navigation
      if (this.isPagerEnabled() && this.hasPager()) {

      }
    } else if (state === K_DATA_UPDATE) {
    } else if (state === K_RESET) {

    }
  }

  doInitialize() {
    this.getDataNodes()
      .doInitialize().pipe(first())
      .subscribe(this.onInitialize.bind(this));
  }


  /**
   * rebuild
   */
  rebuild() {
    this._changeRef.markForCheck();
    this._changeRef.detectChanges();
    this.applyOptions();
    this.getDataNodes().setFrameMode(this.getGridModeName());
    this.calcOffset();
    this.initPager();
    this.calcPager();
    this.doInitialize();
    this.emitEvent('rebuild');
  }


  /**
   * reset
   */
  reset() {
    this.offset = 0;
    this.getDataNodes().reset();
    this.restPager();
    this.emitEvent('reset');
  }

  /**
   * Method called after initial rows fetched
   *
   * @param rows
   */
  onInitialize(rows: any[]) {
    // this.emitEvent('initialized');
    // console.log('');
  }

  private initPager() {
    // if pager enabled get a pager object
    if (this.isPagerEnabled()) {
      this.getPager();
      // this.pager.register('page_action', this.onPagerAction.bind(this));
    } else {
      this._pager = null;
      this.options.enablePager = false;
    }
  }

  isPagerEnabled() {
    return this.getGridModeName() === K_PAGED;
  }

  /**
   * Return the pager service
   */
  getPagerService() {
    return this._pagerService;
  }


  /**
   * Return the pager object or create if necessary
   */
  getPager(create = true) {
    if (!this.hasPager() && create) {
      this._pager = this.getPagerService().get(this.options.pagerId);
    }
    return this._pager;
  }

  /**
   * Check if pager object ist set
   */
  hasPager() {
    return !(typeof this._pager === 'undefined' || this._pager === null);
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
   * Ng Template output
   */
  getValues() {
    return this.getDataNodes().getNodeValues();
  }

  getOptions() {
    return this.options;
  }

  /**
   * Return the grid mode interface
   */
  getGridMode() {
    return this.supportedModes().find(x => x.name === this.getGridModeName());
  }

  /**
   * Return grid row handling mode (@see GRID_MODE)
   */
  getGridModeName() {
    return this.options?.mode;
  }

  /**
   * Set grid mode name
   *
   * @param name
   */
  setGridModeName(name: string | T_GRID_MODE) {
    this.options.mode = name;
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
      const dn = this._dataNodes;
      dn.reset();
      // following two calls are passed by mapping to underlying component
      this.maxRows = nodes.length;
      this.limit = this.options.limit;
      dn.push(...nodes);
      try {
        const gridComp = this.getGridComponent();
        // following two calls are not registered in mapping so use getGridComponent for right object
        gridComp.calcPager();
        gridComp.doInitialize();
      } catch (e) {

      }
    }
  }


  /**
   * To process after page change
   *
   * @param action
   */
  onPagerAction(action: PagerAction) {
    if (this.hasPager() && action.name === this.getPager().name && action.type === 'set') {
      this.getDataNodes().doChangePage(action.page).subscribe(x => {
        // console.log('');
      }, error => console.error(error));
    }
  }


  /**
   * Return all rows
   */
  getRows(): any[] {
    return this.getDataNodes().getNodeValues().getValue().map(x => x.data);
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
    if (this.isPagerEnabled() && this.hasPager()) {
      if (this.params && isNumber(this.maxRows) && isNumber(this.limit)) {
        if (!this.params.offset) {
          this.offset = 0;
          this.paramsChange.emit(this.params);
        }
        this.getPager().calculate(this.offset, this.limit, this.maxRows);
      }
    }
  }

  restPager() {
    if (this.isPagerEnabled() && this.hasPager()) {
      this.getPager().reset();
    }
  }


  ngOnDestroy(): void {
    if (this.subscriptions.length > 0) {
      this.subscriptions.map(x => x.unsubscribe());
    }
    if (this.isPagerEnabled() && this.hasPager()) {
      this._pager = null;
    }
  }


}
