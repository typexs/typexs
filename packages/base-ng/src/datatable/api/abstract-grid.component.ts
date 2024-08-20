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
import { K_DATA_UPDATE, T_QUERY_CALLBACK, T_VIEW_ARRAY_STATES } from '../../lib/datanodes/Constants';
import { BehaviorSubject, Subscription } from 'rxjs';
import { IGridMode, K_INITIAL, K_INITIALIZE, K_OPTIONS, K_PAGED, K_REBUILD, K_RESET, K_VIEW } from './IGridMode';
import { Pager } from '../../pager/Pager';
import { first } from 'rxjs/operators';
import { convertStringToNumber } from '../../lib/functions';


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
   * Remote control of the grid
   *
   * @private
   */
  private _gridControl$: BehaviorSubject<IGridEvent> = new BehaviorSubject<IGridEvent>(undefined);

  /**
   * Variable marking initialization
   *
   * @private
   */
  private _initialized = false;

  /**
   * Reference to parent / called component
   */// eslint-disable-next-line no-use-before-define
  parent: AbstractGridComponent = undefined;

  _params: IQueryParams = {};

  private _changeRef: ChangeDetectorRef;

  private _prevDataState: T_VIEW_ARRAY_STATES;

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
    rows = convertStringToNumber(rows);
    this.setMaxRows(rows);
  }


  @Input()
  columns: IGridColumn[];


  /**
   * get/set predefined rows
   */
  private _initRows: any[] = undefined;

  @Input()
  get rows() {
    if (this.isInitialized()) {
      return this.getRows();
    } else {
      return this._initRows;
    }
  }

  set rows(entries: any[]) {
    if (Array.isArray(entries)) {
      if (this.isInitialized()) {
        this.setRows(entries);
      } else {
        this.getHandle()._initRows = entries;
      }
    }
  }

  /**
   * Return the current limit value
   */
  get limit(): number {
    return this.getDataNodes().limit;
  }

  /**
   * Set the current limit and update data node
   * @param limit
   */
  set limit(limit: number) {
    limit = convertStringToNumber(limit);
    this.getDataNodes().limit = limit;
    if (this.isInitialized()) {
      this.getControl().next({ event: K_OPTIONS, api: this.getGridComponent(), data: { limit: limit } });
    }
  }

  /**
   * Return the current offset value
   */
  get offset(): number {
    return this.getDataNodes().offset;
  }

  /**
   * Set the current limit and update data node
   * @param limit
   */
  set offset(offset: number) {
    offset = convertStringToNumber(offset);
    this.getDataNodes().offset = offset;
    if (this.isInitialized()) {
      this.getControl().next({ event: K_OPTIONS, api: this.getGridComponent(), data: { offset: offset } });
    }

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


  getColumns(): IGridColumn[] {
    return this.columns;
  }

  setColumns(columns: IGridColumn[]) {
    this.columns = columns;
  }

  /**
   * Return supported grid types, default returns only simple view mode
   */
  supportedViewModes(): IGridMode[] {
    return [
      { name: K_VIEW, label: K_VIEW }
    ];
  }

  getViewMode(): string {
    return this.options?.mode;
  }

  setViewMode(viewMode: string) {
    const viewModeSpec = this.supportedViewModes().find(x => x.name === viewMode);
    if (viewModeSpec) {
      if (this.options.mode !== viewMode) {
        this.options.mode = viewMode;
        this.getDataNodes().reset();
        if (this.isInitialized()) {
          this.getControl().next({ event: K_REBUILD, api: this.getGridComponent(), data: { viewMode: viewMode } });
        }
      }
    } else {
      throw new Error('Cant change view mode, cause its isnt defined.');
    }
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
    this._initialized = true;
    this.initRowsIfSet();
    this.emitInitialize();
  }


  /**
   * Initialized cached rows
   * @private
   */
  private initRowsIfSet() {
    const initRows = this.getHandle()._initRows;
    if (this.isInitialized() && Array.isArray(initRows)) {
      this.setRows(initRows);
      this.getHandle()._initRows = undefined;
    }
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
    this.getDataNodes().setFrameMode(this.getViewMode());
    this.calcOffset();
    this.initPager();
    // this.calcPager();

    const subNodes = this.getDataNodes()
      .getState().subscribe(this.onData.bind(this));
    this.subscriptions.push(subNodes);

    const subControl = this.getControl()
      .subscribe(this.onControl.bind(this));
    this.subscriptions.push(subControl);
  }

  /**
   * Method to react on data node changes
   *
   * @param control
   */
  onData(state: T_VIEW_ARRAY_STATES) {
    if (!this.isInitialized()) {
      // react only when already initialized
      return;
    }
    if (this._prevDataState === K_INITIAL && state === K_DATA_UPDATE) {
      // this.emitInitialize();
    }
    this._prevDataState = state;
  }

  /**
   * Method to react on control commands
   *
   * @param control
   */
  onControl(control: IGridEvent) {
    if (!control) {
      // abort on undefined
      return;
    }
    if (control.event === K_INITIALIZE) {
      const gridComp = this.getGridComponent();
      // following two calls are not registered in mapping so use getGridComponent for right object
      gridComp.calcPager();
      gridComp.doInitialize();
      gridComp.emitEvent(K_INITIALIZE);
    } else if (control.event === K_REBUILD || control.event === K_OPTIONS) {
      this.rebuild(control);
    }
  }

  emitInitialize() {
    this.getControl().next({ event: K_INITIALIZE, api: this.api() });
  }

  isEmbeddedGrid() {
    return this.parent !== undefined;
  }

  doInitialize() {
    let queryOnStartup = this.getOptions().queryOnInit;
    if (typeof queryOnStartup !== 'boolean') {
      // default
      queryOnStartup = true;
    }

    if (queryOnStartup) {
      this.getDataNodes()
        .doInitialize()
        .pipe(first())
        .subscribe(this.onUpdate.bind(this));
    }
  }

  isInitialized() {
    return this._initialized;
  }


  /**
   * Rebuild
   */
  rebuild(event?: IGridEvent) {
    const gridComp = this.getGridComponent();
    gridComp.applyOptions();
    gridComp.getDataNodes().setFrameMode(this.getViewMode());
    gridComp.calcOffset();
    if (this.isPagerEnabled()) {
      gridComp.initPager();
      gridComp.calcPager();
    }
    gridComp.doInitialize();
    if (event) {
      gridComp.emitEvent(event.event);
    } else {
      gridComp.emitEvent(K_REBUILD);
    }

  }


  /**
   * Method called after initial rows fetched
   *
   * @param rows
   */
  onUpdate(rows: any[]) {
    this.calcPager();
  }

  private initPager() {
    // if pager enabled get a pager object
    if (this.isPagerEnabled()) {
      this.getPager();
    } else {
      this._pager = undefined;
      this.options.enablePager = false;
    }
  }

  isPagerEnabled() {
    return this.getViewMode() === K_PAGED;
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
    return !(this._pager === undefined || this._pager === null) && !this._pager.isFreeed();
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
    return this.supportedViewModes().find(x => x.name === this.getViewMode());
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
      const dn = this._dataNodes; // etDataNodes();
      dn.reset();
      // following two calls are passed by mapping to underlying component
      this.maxRows = nodes.length;
      this.limit = this.options?.limit;
      dn.push(...nodes);
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
   * Return control observable
   */
  getControl(): BehaviorSubject<IGridEvent> {
    // if (this.parent) {
    //   return this.parent.getControl();
    // }
    return this._gridControl$;
  }

  /**
   * Set max rows entry
   *
   * @param maxRows
   */
  setMaxRows(maxRows: number) {
    const pre = this.getDataNodes().maxRows;
    if (typeof maxRows === 'number' && pre !== maxRows) {
      // this.getDataNodes().reset();
      this.getDataNodes().maxRows = maxRows;
      if (this.isInitialized()) {
        this.getControl()
          .next({
            event: K_REBUILD,
            api: this.getGridComponent(),
            data: { rows: maxRows }
          });
      }
    }
  }


  /**
   * TODO
   * Calculate offset; set offset = 0 when maxRows < limit
   */
  calcOffset() {
    const maxRows = this.getMaxRows();
    if (maxRows < this.limit) {
      this.getDataNodes().offset = 0;
    }
  }


  emitEvent(e: GRID_EVENT_TYPE | string, data?: any) {
    const event: IGridEvent = {
      event: e,
      api: this.getGridComponent() as IGridApi
    };
    if (data) {
      event.data = data;
    }
    this.gridReady.emit(event);
  }

  /**
   * Return the main data object
   */
  getHandle() {
    return this.parent ? this.parent : this;
  }

  calcPager() {
    if (this.isPagerEnabled() && this.hasPager()) {
      if (this.params && isNumber(this.maxRows) && isNumber(this.limit)) {
        if (typeof this.offset !== 'number') {
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


  /**
   * reset
   */
  reset() {
    this.offset = 0;
    this.getDataNodes().reset();
    this.restPager();
    this.emitEvent(K_RESET);
  }

  ngOnDestroy(): void {
    this.reset();
    if (this.subscriptions.length > 0) {
      this.subscriptions.map(x => x.unsubscribe());
    }
    if (this.hasPager()) {
      if (this.getPager().canBeFreed()) {
        this._pager = null;
      }
    }
  }


}
