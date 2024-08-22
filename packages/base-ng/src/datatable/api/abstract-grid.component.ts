import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
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
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { IGridMode, K_INITIAL, K_INITIALIZE, K_OPTIONS, K_PAGED, K_REBUILD, K_RESET, K_VIEW } from './IGridMode';
import { Pager } from '../../pager/Pager';
import { distinctUntilChanged, first, tap } from 'rxjs/operators';
import { convertStringToNumber } from '../../lib/functions';


@Component({
  template: ''
})
export class AbstractGridComponent implements IGridApi, OnInit, OnChanges, OnDestroy, AfterViewInit {


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
  private gridControl$: BehaviorSubject<IGridEvent>; // = new BehaviorSubject<IGridEvent>(undefined);
  private _gridControl$: Observable<IGridEvent>; // = new BehaviorSubject<IGridEvent>(undefined);

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
    const spanParams: IQueryParams = {};
    const l = this.limit;
    if (l) {
      spanParams.limit = l;
    }
    const o = this.offset;
    if (o) {
      spanParams.offset = o;
    }

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

  set maxRows(maxRows: number) {
    maxRows = convertStringToNumber(maxRows);
    this.setMaxRows(maxRows);
    if (this.isInitialized()) {
      this.triggerControl(K_OPTIONS, maxRows + '', { maxRows: maxRows });
    }
  }


  @Input()
  columns: IGridColumn[];


  /**
   * get/set predefined rows
   */
  // private _initRows: any[] = undefined;

  @Input()
  get rows() {
    return this.getRows();
  }

  set rows(entries: any[]) {
    if (Array.isArray(entries)) {
      this.setRows(entries);
      // if (this.isInitialized()) {
      //   this.triggerControl(K_REBUILD, null);
      // }
    }
  }

  /**
   * Return the current limit value
   */
  get limit(): number {
    return this.getDataNodes().limit;
    // if (this.isInitialized()) {
    //   return this.getDataNodes().limit;
    // } else {
    //   return this.getHandle()._initCache['limit'];
    // }
  }

  /**
   * Set the current limit and update data node
   * @param limit
   */
  set limit(limit: number) {
    limit = convertStringToNumber(limit);
    this.getDataNodes().limit = limit;
    if (this.isInitialized()) {
      this.triggerControl(K_OPTIONS, 'limit' + limit + '', { limit: limit });
    }
  }

  /**
   * Return the current offset value
   */
  get offset(): number {
    return this.getDataNodes().offset;
    // if (this.isInitialized()) {
    //   return this.getDataNodes().offset;
    // } else {
    //   return this.getHandle()._initCache['offset'];
    // }
  }

  /**
   * Set the current limit and update data node
   * @param limit
   */
  set offset(offset: number) {
    offset = convertStringToNumber(offset);
    this.getDataNodes().offset = offset;
    if (this.isInitialized()) {
      this.triggerControl(K_OPTIONS, 'offset-' + offset + '', { limit: offset });
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

  /**
   * Overridable method for additional contructor extensions
   */
  construct() {
  }

  /**
   * ==============================
   *  Angular implementations
   * ==============================
   */

  /**
   * Impl. of onInit method
   *
   */
  ngOnInit(): void {
    this.applyOptions();
  }

  /**
   * Load data after init
   */
  ngAfterViewInit() {
    this.initialize();
    this._initialized = true;
    this.emitInitialize();
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log(changes);
  }

  /**
   * Impl. of onDestroy
   */
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

  /**
   * ==============================
   */

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
        // if (this.isInitialized()) {
        //   this.getControl().next({ event: K_REBUILD, api: this.getGridComponent(), data: { viewMode: viewMode } });
        // }
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
   * Called after view is initialized
   */
  initialize() {
    // set mode
    this.getDataNodes().setFrameMode(this.getViewMode());
    this.calcOffset();
    this.initPager();

    const subNodes = this.getDataNodes()
      .getState().subscribe(this.onData.bind(this));
    this.subscriptions.push(subNodes);

    const subControl = this.getControlObserver().subscribe(this.onControl.bind(this));
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
      // gridComp.emitInitialize();
    } else if (control.event === K_REBUILD || control.event === K_OPTIONS) {
      this.rebuild(control);
    }
  }

  emitInitialize() {
    this.triggerControl(K_INITIALIZE);
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

    const maxRowReached = this.getDataNodes().isReachedMaxRows()
    if (queryOnStartup && !maxRowReached) {
      this.getDataNodes()
        .doInitialize()
        .pipe(first())
        .subscribe(this.onUpdate.bind(this));
    }
  }

  doRebuild() {
    this.getDataNodes().reset();
    this.getDataNodes()
      .doInitialize()
      .pipe(first())
      .subscribe(this.onUpdate.bind(this));
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
    gridComp.doRebuild();
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
    return this._dataNodes;
  }

  /**
   * Set data nodes on local instance or the embedding one
   */
  setDataNodes(nodes: any[]) {
    // if (this.parent) {
    //   this.parent.setDataNodes(nodes);
    // } else {
    const dn = this._dataNodes; // etDataNodes();
    dn.reset();
    // following two calls are passed by mapping to underlying component
    this.setMaxRows(nodes.length);
    this.getDataNodes().limit = this.options?.limit;
    dn.push(...nodes);
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
   * Return control for pushing orders
   */
  getControl(): BehaviorSubject<IGridEvent> {
    // if (this.parent) {
    //   return this.parent.getControl();
    // }
    return this.createOrGetControl();
  }

  /**
   * Return observable for control
   */
  getControlObserver(): Observable<IGridEvent> {
    // if (this.parent) {
    //   return this.parent.getControlObserver();
    // }
    this.createOrGetControl();
    return this._gridControl$;
  }

  private createOrGetControl(): BehaviorSubject<IGridEvent> {
    // if (this.parent) {
    //   return this.parent.createOrGetControl();
    // }
    if (!this._gridControl$) {
      this.gridControl$ = new BehaviorSubject<IGridEvent>(undefined);
      this._gridControl$ = this.gridControl$
        .pipe(
          distinctUntilChanged((x, y) => {
            const res = !!x && !!y && x.event === y.event && x.change === y.change;
            return res;
          })
        );
    }
    return this.gridControl$;
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

  triggerControl(e: GRID_EVENT_TYPE | string, changeKey: string = null, data?: any) {
    const event: IGridEvent = {
      event: e,
      api: this.getGridComponent() as IGridApi,
      change: changeKey
    };
    if (data) {
      event.data = data;
    }
    this.getControl().next(event);
  }


  emitEvent(e: GRID_EVENT_TYPE | string, changeKey: string = null, data?: any) {
    const event: IGridEvent = {
      event: e,
      api: this.getGridComponent() as IGridApi,
      change: changeKey
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


}
