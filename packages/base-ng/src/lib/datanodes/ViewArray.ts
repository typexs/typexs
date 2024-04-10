import { BehaviorSubject, iif, Observable, of } from 'rxjs';
import { Node } from './Node';
import { IIndexSpan } from './IIndexSpan';
import { K_DATA_UPDATE, K_FRAME_UPDATE, K_INITIAL, K_RESET, T_QUERY_CALLBACK, T_VIEW_ARRAY_STATES } from './Constants';
import { concatMap, first, mergeMap, switchMap, toArray, last } from 'rxjs/operators';
import { Log } from '../log/Log';
import { K_INFINITE, K_PAGED, T_GRID_MODE } from '../../datatable/api/IGridMode';


const INIT_SPAN: IIndexSpan = {
  start: 0,
  end: 0,
  range: 25
};

/**
 * ViewArray
 *
 * Handles the entries in the array independent by the view mode (view, paged, infinite, ..).
 *
 * - fetching of missing records or cleanup on.
 *
 * - mode:
 *   - paged - fixed frame size for records display (paging)
 *   - infinite - frame is fixed on top (record 0) till current selection
 *
 * - callback on reaching limit
 * - cleanup cached values
 * - frame size defines how many items fit in the offsetHeight
 * - loaded contains the span of loaded
 * - frame definies current view span
 *   - when moved up or download missing record plus additional span if option for this is set
 */
export class ViewArray<T> {

  /**
   * Map holding the node data
   *
   * @private
   */
  private arr = new Map<number, Node<T>>();

  /**
   * Loaded entities
   */
  private _loaded: IIndexSpan = Object.assign({}, INIT_SPAN);

  /**
   * The view frame
   *
   * @private
   */
  private _frame: IIndexSpan = Object.assign({}, INIT_SPAN);

  /**
   * Max row count
   */
  private _maxRows: number;

  /**
   * Callback for extern data provider
   *
   * @private
   */
  private _fn: T_QUERY_CALLBACK<T>;

  /**
   * Values selected for the view frame
   *
   * @private
   */
  private values$: BehaviorSubject<Node<T>[]> = new BehaviorSubject<Node<T>[]>([]);


  /**
   * Mode
   *  - framed - fixed frame size for records display (paging)
   *  - top-fixed - frame is fixed on top (record 0) till current selection
   *
   * @private
   */
  private frameMode: T_GRID_MODE | string = K_PAGED;

  /**
   * TODO: Cache only this amount of nodes, cleanup first if scrolling down and last when scrolling up.
   *
   * If set to -1 ignore caching.
   *
   * @private
   */
  private cacheLimit = -1;

  /**
   * Number of records which should be prefetched
   *
   * @private
   */
  private preFetch = 0;

  /**
   * State of the array
   *
   * @private
   */
  private state$ = new BehaviorSubject<T_VIEW_ARRAY_STATES>(undefined);


  /**
   * Limit to prefill array with empty nodes
   * Works in infinite mode.
   *
   * @param x
   */
  private prefillLimit = 1000;
  //
  // private _pipeline = new BehaviorSubject<any>(undefined);
  //
  // private pipeline$: Observable<any>;

  constructor(...x: any[]) {
    // this.pipeline$ = this._pipeline.pipe(
    //   mergeMap(v => iif(() => v, of([]), this.doFrameReload())),
    //   concatMap(this.doPreload.bind(this)),
    //   concatMap(this.getFrameAsArray.bind(this)),
    //   toArray(),
    //   concatMap(this.passToValues.bind(this)),
    //   toArray()
    // );
    //
    this.markAsInitial();
    if (x.length > 0) {
      this.push(...x);
    }
  }

  markAsInitial() {
    this.markAs(K_INITIAL);
  }

  markAsDataUpdate() {
    this.markAs(K_DATA_UPDATE);
  }

  markAsFrameUpdate() {
    this.markAs(K_FRAME_UPDATE);
  }

  private markAs(value: T_VIEW_ARRAY_STATES) {
    this.state$.next(value);
  }

  getNode(idx: number): Node<T> {
    return this.arr.get(idx);
  }

  get(idx: number): T {
    return this.getNode(idx)?.data;
  }


  /**
   * Set a value on specific array position
   *
   * @param idx
   * @param value
   */
  set(idx: number, value: T, skipCalc = false) {
    const node = new Node<T>(value, idx);
    this.arr.set(idx, node);
    if (!skipCalc) {
      this.calcLoadedIndex([idx]);
    }
  }


  /**
   * Append entries to array without
   *
   * @param items
   */
  push(...items: any[]): number {
    let l = this.loadedLength;
    const _items = items.map(x => new Node<T>(x, l++));
    const idx: number[] = [];
    _items.forEach(x => {
      this.arr.set(x.idx, x);
      idx.push(x.idx);
    });
    this.calcLoadedIndex(idx);
    return idx.length;
  }

  /**
   * Return the amount of nodes contained in map
   */
  get length() {
    return this.arr.size;
  }

  get loadedLength() {
    return this._loaded.end - this._loaded.start;
  }

  get frameLength() {
    return this._frame.end - this._frame.start;
  }

  calcLoadedIndex(idxs: number[]) {
    const min = Math.min(...idxs);
    const max = Math.max(...idxs);
    if (this._loaded.start >= min) {
      this._loaded.start = min;
    }
    if (this._loaded.end < max) {
      this._loaded.end = max;
    }
    this.markAsDataUpdate();
  }

  /**
   * Return observable states
   */
  getState() {
    return this.state$.asObservable();
  }

  getNodesArray(startIdx?: number, endIdx?: number) {
    const start = typeof startIdx === 'number' ? startIdx : this.getLoadBoundries().start;
    const end = typeof endIdx === 'number' ? endIdx : this.getLoadBoundries().end;
    const arr = [];
    for (let i = start; i <= end; i++) {
      const entry = this.getNode(i);
      arr.push(entry);
    }
    return arr;
  }


  private resetVars() {
    this.arr.clear();
    this._loaded = Object.assign({}, INIT_SPAN);
    this._frame = Object.assign({}, INIT_SPAN);
    this.maxRows = undefined;
  }

  /**
   * Reset array to zero elements
   */
  reset() {
    this.resetVars();
    this.values$.next([]);
    this.markAs(K_RESET);
    this.markAsInitial();
  }

  /**
   * Return nodes with embedded data
   */
  getNodeValues() {
    return this.values$;
  }

  /**
   * Return data values
   */
  getValues() {
    return this.getNodeValues().getValue().map(x => x ? x.data : undefined);
  }

  get maxRows() {
    return this._maxRows;
  }

  set maxRows(maxRows: number) {
    this._maxRows = maxRows;
  }

  /**
   * Create an empty node if no entry present
   *
   * @param from
   * @param to
   * @private
   */
  private fillWithEmptyNode(from: number, to: number) {
    for (let i = from; i <= to; i++) {
      const r = this.getNode(i);
      if (!r) {
        this.set(i, undefined);
      }
    }
  }

  get limit(): number {
    return this._frame.range;
  }

  set limit(limit: number) {
    this._frame.range = limit;
    this.updateFramedPosition(0);
    // this.setView();
  }

  get offset(): number {
    return this._frame.start;
  }

  set offset(offset: number) {
    this.updateFramedPosition(offset);
  }


  /**
   * Is max rows reached
   */
  isReachedMaxRows() {
    if (typeof this.maxRows === 'number') {
      // todo check if last row
      return this._loaded.end >= this.maxRows - 1;
      // return this.length >= this.maxRows;
    }
    return false;
  }

  /**
   * Check if a value is set on an special idx
   *
   * @param idx
   */
  isValueSet(idx: number) {
    if (this.arr.has(idx)) {
      const x = this.arr.get(idx);
      return typeof x.data !== 'undefined';
    }
    return false;
  }

  /**
   * Finalize array
   */
  destroy() {
    this.setNodeCallback(undefined);
    this.resetVars();
    this.values$.complete();
    this.state$.complete();

  }

  /**
   * Set callback for retrieving data from extern source
   *
   * @param fn
   */
  setNodeCallback(fn: (startIdx: number, endIdx: number, limit?: number) => Observable<T[]>) {
    this._fn = fn;
  }

  /**
   * Helper to check if callback is present
   */
  hasNodeCallback() {
    return typeof this._fn === 'function';
  }

  /**
   * Execute callback an apply values
   */
  doFetch(startIdx: number, endIdx: number, limit?: number) {
    if (!this.hasNodeCallback()) {
      // Log.error('No callback for fetching node data defined.');
      return of([]);
    }
    return this._fn(startIdx, endIdx, limit)
      .pipe(
        switchMap((values: T[] & { $count: number }) => {
          if (Array.isArray(values)) {
            if (typeof values['$count'] === 'number') {
              this.maxRows = values['$count'];
            }
            this.applyFetchData(startIdx, values);
          }
          return values;
        }),
        toArray()
      );
  }


  /**
   * Add data to array
   *
   * @param startIdx
   * @param nodes
   */
  applyFetchData(startIdx: number, nodes: T[]) {
    // check if size
    const idx = [];
    let posIdx = startIdx;
    for (const val of nodes) {
      idx.push(posIdx);
      this.set(posIdx, val, true);
      posIdx++;
    }
    this.calcLoadedIndex(idx);
    return idx;

  }

  /**
   * Count how many undefined values are present between start and end index.
   * The start index is included the end not.
   *
   * @param startIdx
   * @param endIdx
   *
   */
  checkForUndefined(startIdx: number, endIdx: number, dir: 'forward' | 'backward' = 'forward') {
    const undefinedCount: number[] = [];
    if (dir === 'backward') {
      for (let i = endIdx; i >= startIdx; i--) {
        const node = this.getNode(i);
        if (!node || node.data === undefined) {
          undefinedCount.push(i);
        }
      }
    } else {
      for (let i = startIdx; i <= endIdx; i++) {
        const node = this.getNode(i);
        if (!node || node.data === undefined) {
          undefinedCount.push(i);
        }
      }
    }
    return undefinedCount;
  }


  /**
   * Return plain array with elements
   */
  asArray() {
    const copy = [];
    for (const [idx, t] of this.arr.entries()) {
      copy[idx] = t ? t.data : undefined;
    }
    return copy;
  }


  /**
   * Get the frame mode
   */
  getFrameMode() {
    return this.frameMode;
  }

  /**
   * Set the frame mode
   *
   * @param framed
   */
  setFrameMode(framed: T_GRID_MODE | string) {
    this.frameMode = framed;
  }


  /**
   * Check if caching is enabled
   *
   * if cacheLimit is -1 then it is disabled
   * if cacheLimit is 0 then it is unlimited
   * if cacheLimit > 0 then this is the max caching node limit
   */
  isCachingEnabled() {
    return this.cacheLimit !== -1;
  }

  /**
   * Check if all frame span data are loaded
   */
  isFrameReady() {
    if (this.hasNodeCallback() && !this.isCachingEnabled()) {
      return false;
    }
    const boundries = this.getFrameBoundries();
    const res = this.checkForUndefined(boundries.start, boundries.end);
    return res.length === 0;
  }

  /**
   * Frame reload
   */
  doFrameReload() {
    // this.updateFramedPosition();
    const boundries = this.getFrameBoundries();
    return this.doFetch(boundries.start, boundries.end, boundries.range);
  }

  /**
   * Updates the frame span
   *
   * @param start
   * @param end
   * @param limit
   //  */
  private updateFramedPosition(start?: number, end?: number, limit?: number) {
    const _limit = limit ? limit : this._frame.range;
    let change = false;
    if (typeof start === 'number') {
      if (this._frame.start !== start) {
        change = true;
      }
      this._frame.start = start;
    }
    if (typeof end === 'number') {
      if (this._frame.end !== end) {
        change = true;
      }
      this._frame.end = end;
    } else {
      end = this._frame.start + _limit - 1;
      if (this._frame.end !== end) {
        change = true;
      }
      this._frame.end = end;
    }
    return this._frame;
  }

  getFrameBoundries() {
    const boundries: IIndexSpan = {
      start: this._frame.start,
      end: this._frame.end,
      range: this._frame.range
    };
    if (typeof this.maxRows === 'number' && this.maxRows - 1 <= boundries.end) {
      boundries.end = this.maxRows - 1;
    }
    return boundries;
  }

  getLoadBoundries() {
    return this._loaded;
  }

  /**
   * Load nodes by navigation page number
   *
   * @param page
   */
  doFetchFrameByPage(page: number) {
    this.setCurrentPage(page);
    return this.doFrameReload();
  }

  getCurrentPage() {
    return this._frame.start / this._frame.range + 1;
  }

  setCurrentPage(page: number) {
    const startIdx = (page - 1) * this._frame.range;
    this.updateFramedPosition(startIdx);
    return this.isFrameReady();
  }

  /**
   * Mode independent initialization of first rows
   */
  doInitialize() {
    if (this.frameMode === K_PAGED) {
      return this.doChangePage(this.getCurrentPage());
    } else if (this.frameMode === K_INFINITE) {
      this.checkFillEmptyNodes();
      return this.doChangeSpan(0, this._frame.range - 1);
    } else {
      // this.checkFillEmptyNodes();
      return this.doChangeSpan(0, this._loaded.end);
    }
    // throw new Error('unknown frame mode');
  }


  /**
   * Check if max rows is fully filled with empty nodes
   */
  checkFillEmptyNodes() {
    if (this.length < this.maxRows) {
      let endIdx = this.getLoadBoundries().end + this.prefillLimit;
      if (endIdx >= this.maxRows) {
        endIdx = this.maxRows - 1;
      }
      this.fillWithEmptyNode(this.getLoadBoundries().end + 1, endIdx);
    }
  }

  /**
   * Change page process with observable return
   *
   * @param page
   */
  doChangePage(page: number) {
    const isReady = this.setCurrentPage(page);
    // this._pipeline.next(isReady);
    // return this.pipeline$;
    return this._doChange(isReady);
  }

  /**
   * Change offset process with observable return
   *
   * @param start
   * @param end
   */
  doChangeSpan(start: number, end: number) {
    this.updateFramedPosition(start, end);
    const isReady = this.isFrameReady();
    // this._pipeline.next(isReady);
    // return this.pipeline$.pipe(last());
    return this._doChange(isReady);
  }

  /**
   * Change process
   *
   * @param isReady
   * @private
   */
  private _doChange(isReady: boolean) {
    let obs = null;
    if (isReady) {
      obs = of([]);
    } else {
      obs = this.doFrameReload();
    }
    obs = obs.pipe(
      mergeMap(v => iif(() => isReady, of([]), this.doFrameReload())),
      concatMap(this.doPreload.bind(this)),
      concatMap(this.getFrameAsArray.bind(this)),
      toArray(),
      concatMap(this.passToValues.bind(this)),
      toArray(),
      last()
    );
    return obs;
  }

  getFrameAsArray(): Node<T>[] {
    const boundries = this.getFrameBoundries();
    const scale = boundries.start;
    const copy: Node<T>[] = [];
    for (let i = boundries.start; i <= boundries.end; i++) {
      const idx = i - scale;
      const node = this.getNode(i);
      copy[idx] = node;
    }
    return copy;
  }


  getLoadedAsArray() {
    const boundries = this.getLoadBoundries();
    // const scale = boundries.start;
    const copy: Node<T>[] = [];
    for (let i = boundries.start; i <= boundries.end; i++) {
      // const idx = i - scale;
      const node = this.getNode(i);
      copy[i] = node;
    }
    return copy;
  }

  /**
   * Copy values to the
   *
   * @param nodes
   * @private
   */
  private passToValues(nodes: Node<T>[]) {
    if (this.frameMode === K_PAGED) {
      this.getNodeValues().next(nodes);
    } else {
      this.getNodeValues().next(this.getLoadedAsArray());
    }
    this.markAsFrameUpdate();
    return nodes;
  }


  /**
   * Check if preload is possible
   */
  checkIfPreload(): IIndexSpan {
    if (this.preFetch <= 0) {
      return null;
    }
    const loaded = this.getLoadBoundries();
    const frame = this.getFrameBoundries();
    const diff = loaded.end - frame.end;

    if (diff < this.preFetch) {
      // diff is lower when loaded end is near or lower frame end
      const chunks = Math.ceil((this.preFetch - diff) / loaded.range);
      const startIdx = loaded.end > 0 ? loaded.end + 1 : 0;
      const endIdx = startIdx + chunks * loaded.range - 1;
      return { start: startIdx, end: endIdx, range: loaded.range };
    } else {
      return null;
    }
  }

  /**
   * Preload records when loaded.end - frame.end is smaller the give prefetch
   */
  doPreload(): Observable<T[]> {
    const check = this.checkIfPreload();
    if (check === null) {
      return of([]);
    }
    return this.doFetch(check.start, check.end);
  }

  setPrefetchLimit(prefetch: number) {
    this.preFetch = prefetch;
  }

  setCacheLimit(c: number) {
    this.cacheLimit = c;
  }

  hasMorePages(): boolean {
    if (typeof this.maxRows === 'number') {
      const page = this.getCurrentPage();
      const startIdx = (page - 1) * this.limit;
      const endIdx = startIdx + this.limit - 1;
      return endIdx < this.maxRows - 1;
    } else {
      return true;
    }
  }
}
