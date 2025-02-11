import { BehaviorSubject, iif, Observable, of } from 'rxjs';
import { Node } from './Node';
import { IIndexSpan } from './IIndexSpan';
import {
  K_$COUNT,
  K_APPEND,
  K_DATA_UPDATE,
  K_FRAME_UPDATE,
  K_INITIAL, K_INSERT,
  K_REMOVE,
  K_RESET,
  T_QUERY_CALLBACK,
  T_VIEW_ARRAY_STATES
} from './Constants';
import { concatMap, last, mergeMap, switchMap, toArray } from 'rxjs/operators';
import { K_INFINITE, K_PAGED, K_VIEW, T_GRID_MODE } from '../../datatable/api/IGridMode';
import { orderBy } from 'lodash';


const INIT_SPAN: IIndexSpan = {
  start: 0,
  end: -1,
  range: 25
};

export interface IArrayEvent {
  type: T_VIEW_ARRAY_STATES;
}

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
   * Enable or disable fetching by callback
   */
  private fetchByCallback = true;

  /**
   * State of the array
   *
   * @private
   */
  private state$ = new BehaviorSubject<IArrayEvent>(undefined);


  /**
   * Limit to prefill array with empty nodes
   * Works in infinite mode.
   *
   * @param x
   */
  private prefillLimit = 1000;

  /**
   * Define handles for data access and change
   */
  private handles: {
    [key: string]: {
      get: (node: Node<any>) => any,
      set: (node: Node<any>, value: any) => void
    }
  } = {};


  constructor(...x: any[]) {
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

  private markAs(value: T_VIEW_ARRAY_STATES, data: any = {}) {
    this.state$.next({ type: value, ...data });
  }

  getNode(idx: number): Node<T> {
    return this.arr.get(idx);
  }

  setNode(node: Node<any>, skipCalc = false) {
    this.arr.set(node.idx, node);
    if (!skipCalc) {
      this.calcLoadedIndex([node.idx]);
    }
    return node;
  }

  setFetchByCallback(value: boolean) {
    this.fetchByCallback = value;
  }

  /**
   * Get the node value
   *
   * @param idx
   */
  get(idx: number): T {
    return this.getNode(idx)?.data;
  }


  /**
   * Set a value on specific array position
   *
   * @param idx
   * @param value
   */
  set(idx: number, value: T | Node<T>, skipCalc = false, skipPrevDel = false) {
    let node = null;
    if (value instanceof Node) {
      node = value;
    } else {
      node = new Node<T>(value, idx);
    }
    if (node.idx && idx && !skipPrevDel) {
      if (node.idx !== idx && this.arr.has(node.idx)) {
        // remove from old position
        this.arr.delete(node.idx);
      }
    }
    node.idx = idx;
    return this.setNode(node, skipCalc);
  }

  /**
   * Add data as node to the end of the view array
   */
  append(value: T | Node<any>, upCount = true) {
    let idx = undefined;
    if (this.hasMaxItems()) {
      // extend max node else
      idx = this.maxRows;
      this.maxRows = this.maxRows + 1;
    } else {
      if (this.getLoadBoundries().end === -1) {
        idx = this.getLoadBoundries().end = 0;
      } else {
        idx = this.getLoadBoundries().end + 1;
      }
    }
    const ret = this.set(idx, value);
    this.markAs(K_APPEND, { node: ret });
    return ret;
  }

  /**
   * Remove node with data from some position
   *
   * @param idx
   */
  remove(idx: number | Node<T>, downCount = false) {
    const node = idx instanceof Node ? idx : this.getNode(idx);
    if (node) {
      this.arr.delete(node.idx);
      // node.idx = undefined;
      if (downCount) {
        // TODO
        this.upDownMax(-1);
      }
      this.markAs(K_REMOVE, { node: node });
    }
    return node;
  }

  /**
   * Insert a node or value on a special position.
   * If option override is set then override existing value.
   *
   * @param idx
   * @param value
   */
  insert(idx: number, value: T | Node<T>, override = false) {
    // if node exists
    const alreadyExistsingNode = this.getNode(idx);
    if (alreadyExistsingNode && !override) {
      this.idxUpDownCount(idx);
    }
    const ret = this.set(idx, value);
    this.markAs(K_INSERT, { node: ret });
    return ret;
  }

  /**
   * Swap position of two nodes
   *
   * @param fromIdx
   * @param toIdx
   */
  swap(fromIdx: number, toIdx: number) {
    let fromNode = this.getNode(fromIdx);
    let toNode = this.getNode(toIdx);
    // if (toNode) {
    //   this.idxUpDownCount(toIdx);
    // }
    // remove node
    fromNode = this.remove(fromNode);
    toNode = this.remove(toNode);
    this.set(fromIdx, toNode, true, true);
    this.set(toIdx, fromNode, true, true);
  }

  /**
   * Move a node from position fromIdx to toIdx and change idx of the nodes between the change.
   * Return the changes position offset. If moved down then value will be negative else positiv.
   * Zero is no change.
   *
   * @param fromIdx
   * @param toIdx
   * @return number
   */
  move(fromIdx: number, toIdx: number, size = 1) {
    if (size < 0) {
      throw new Error('size must be a positive integer');
    }
    let offset = toIdx - fromIdx;
    if (offset === 0) {
      return offset;
    }

    let takeOut = this.between(fromIdx, fromIdx + size - 1);
    takeOut.map(x => this.remove(x, false));
    let idx: number[] = [];
    // adjust offset for size > 1
    let adjustedOffset = offset - size + 1;
    if (offset > 0) {
      // move up, node between to and from must be count down
      // 1,2 -> 3,4; [3,4] - 2; [1,2] + 3 = [3,4]:
      const idxs = this.changeIdx(fromIdx + size, toIdx, -size);
      idx.push(...idxs);
    } else {
      // move down, node between from and to must be count up
      // 012345 -> 045123
      // 4,5 -> 1,2; [1,2,3] + 2 = [3,4,5]
      const idxs = this.changeIdx(toIdx, fromIdx - 1, size);
      idx.push(...idxs);
      adjustedOffset = offset;
    }


    takeOut.map(x => {
      const newIdx = x.idx + adjustedOffset;
      this.set(newIdx, x, false, true);
      idx.push(newIdx);
    });
    if (idx.length > 0) {
      this.calcLoadedIndex(idx);
    }
    return offset;
  }

  /**
   * Change idx by passed size of multiple nodes between from and to idx.
   * @param startIdx
   * @param stopIdx
   * @param offset
   */
  changeIdx(startIdx: number, stopIdx: number, offset = 1) {
    if (startIdx > stopIdx) {
      throw new Error('index is out of bound');
    }
    const nodes = this.between(startIdx, stopIdx);
    let idx = [];
    // const dir = toIdx - fromIdx + offset;
    if (offset >= 0) {
      nodes.sort((a, b) => b.idx - a.idx);
    } else {
      nodes.sort((a, b) => a.idx - b.idx);
    }
    for (const n of nodes) {
      const newIdx = n.idx + offset;
      this.set(newIdx, n, false);
      idx.push(newIdx);
    }
    return idx;
  }


  /**
   * Return all idx or selected by passed filter function.
   *
   * @param filter
   */
  keysAsArray(filter?: (k: number) => boolean) {
    const keys = [];
    for (const l of this.arr.keys()) {
      if (filter) {
        if (filter(l)) {
          keys.push(l);
        }
      } else {
        keys.push(l);
      }
    }
    return keys;
  }

  /**
   * Return the node entries between idx from and to (including last one).
   *
   * @param fromIdx
   * @param toIdx
   * @return Node<T>
   */
  between(fromIdx: number, toIdx: number): Node<T>[] {
    const arr: Node<T>[] = [];
    for (let i = fromIdx; i <= toIdx; i++) {
      const node = this.getNode(i);
      if (node) {
        arr.push(node);
      }
    }
    return arr;
  }

  /**
   * Increment all idx from a given idx by a given size.
   * When size is 0 nothing is done. When size is greater then 0,
   * then all idx greater then given idx are up-counted else
   * all idx lower given idx are down-counted by given size.
   *
   * @param fromIdx
   */
  idxUpDownCount(fromIdx: number, size = 1) {
    if (size === 0) {
      return;
    }
    let mode = size > 0 ? 'up' : 'down';
    const keysUp = this.keysAsArray(x => mode === 'up' ? x >= fromIdx : x <= fromIdx).sort();
    const newIdx = [];
    for (const idx of mode === 'up' ? keysUp.reverse() : keysUp) {
      const changeNode = this.getNode(idx);
      if (changeNode) {
        const changeIdx = idx + size;
        changeNode.idx = changeIdx;
        this.arr.delete(idx);
        this.arr.set(changeIdx, changeNode);
        newIdx.push(changeIdx);
      }
    }
    if (newIdx.length > 0) {
      this.calcLoadedIndex(newIdx);
    }
  }

  // TODO
  // /**
  //  * Switch node between from and to position
  //  * @param fromIdx
  //  * @param toIdx
  //  */
  // switch(fromIdx: number, toIdx: number) {
  //
  // }

  /**
   * Append entries to array without
   *
   * @param items
   */
  push(...items: any[]): number {
    let l = this.highestLoadedIdx() + 1;
    const _items = items.map(x => new Node<T>(x, l++));
    const idx: number[] = [];
    _items.forEach(x => {
      this.set(x.idx, x, true);
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
    const loaded = this.getLoadBoundries();
    return loaded.end - loaded.start + 1;
  }

  get frameLength() {
    return this._frame.end - this._frame.start + 1;
  }

  calcLoadedIndex(idxs: number[]) {
    if (idxs.length === 0) {
      return;
    }
    const min = Math.min(...idxs);
    const max = Math.max(...idxs);
    if (this._loaded.start >= min || this._loaded.start === -1) {
      this._loaded.start = min;
    }
    if (this._loaded.end < max) {
      this._loaded.end = max;
    }
    if (this._frame.end === -1) {
      this._frame.start = min;
      if (this._frame.range > max) {
        this._frame.end = max;
      } else {
        this._frame.end = this._frame.range - 1;
      }
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


  /**
   * Reset map and variables
   *
   * @private
   */
  private resetVars() {
    this.arr.clear();
    const limit = this.limit;
    this._loaded = Object.assign({}, INIT_SPAN);
    this._frame = Object.assign({}, INIT_SPAN, { range: limit });
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

  hasMaxItems() {
    return typeof this.maxRows !== 'undefined';
  }

  max() {
    if (this.hasMaxItems()) {
      return this.maxRows;
    } else {
      return this.getLoadBoundries().end + 1;
    }
  }

  upDownMax(value: number) {
    if (this.hasMaxItems()) {
      this.maxRows = this.maxRows + value;
    } else {
      this.getLoadBoundries().end = this.getLoadBoundries().end + value;
    }
  }

  highestLoadedIdx() {
    return this._loaded.end;
  }


  get limit(): number {
    return this._frame.range;
  }

  set limit(limit: number) {
    this._frame.range = limit;
    this.updateFramedPosition(0);
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
      return this.loadedLength >= this.maxRows - 1;
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
  isFetchByCallbackSet() {
    return typeof this._fn === 'function' && this.fetchByCallback;
  }

  /**
   * Execute callback an apply values
   */
  doFetch(boundries: IIndexSpan) {
    if (!this.isFetchByCallbackSet()) {
      // Log.error('No callback for fetching node data defined.');
      return of([]);
    }
    return this._fn(boundries.start, boundries.end, boundries.range)
      .pipe(
        // tap(x => console.log(x)),
        switchMap((values: T[] & { $count: number }) => {
          if (Array.isArray(values)) {
            if (typeof values[K_$COUNT] === 'number') {
              this.maxRows = values[K_$COUNT];
            }
            this.insertNodes(boundries.start, values);
          }
          return values;
        }),
        toArray()
      );
  }


  /**
   * Add data to array on a given start position
   *
   * @param startIdx
   * @param nodes
   */
  insertNodes(startIdx: number, nodes: T[]) {
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
        if (!node || node.isEmpty()) {
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
   * Check if all frame data is loaded for a given boundry.
   * If not set take the currently applied boundy.
   */
  isFrameReady(boundries?: IIndexSpan) {
    if (this.isFetchByCallbackSet() && !this.isCachingEnabled()) {
      return false;
    }
    if (!boundries) {
      boundries = this.getFrameBoundries();
      if (boundries.end === -1) {
        boundries.end = boundries.start + boundries.range - 1;
      }
    }
    // if (boundries.end < boundries.start) {
    //   return false;
    // }
    const res = this.checkForUndefined(boundries.start, boundries.end);
    return res.length === 0;
  }

  /**
   * Frame reload
   */
  doFrameReload(boundries?: IIndexSpan) {
    if (!boundries) {
      boundries = this.getFrameBoundries();
    }
    return this.doFetch(boundries);
  }


  private checkFrameBoundries(start?: number, end?: number, limit?: number): IIndexSpan {
    let change = false;
    let _start = this._frame.start;
    let _end = this._frame.end;
    const _limit = limit ? limit : this._frame.range;
    const maxRows = this.hasMaxItems() ? this.maxRows : undefined;
    const isZero = end === 0;

    if (typeof start === 'number' && !isNaN(start)) {
      if (_start !== start) {
        change = true;
      }
      _start = start;
      if (maxRows && _start >= maxRows) {
        _start = undefined;
        _end = undefined;
      }
    }

    if (_start !== undefined) {
      if (typeof end === 'number' && !isNaN(end)) {
        if (_end !== end) {
          change = true;
        }
        _end = end;
      } else if (_limit > 0) {
        end = _start + _limit - 1;
        if (_end !== end) {
          change = true;
        }
        _end = end;
      } else {
        _end = undefined;
      }


      if (maxRows) {
        if (_end === undefined || isZero || _end >= maxRows - 1) {
          _end = maxRows - 1;
        }
      }

      if (_end !== undefined && _start > _end) {
        // restore start
        if (!isZero) {
          _start = _end - _limit + 1;
        } else {
          _end = _start + _limit - 1;
        }
      }

      if (_start < 0) {
        _start = 0;
      }
      if (_end !== undefined && _end < 0) {
        _end = 0;
      }

    }

    return { start: _start, end: _end, range: _limit, change: change };
  }


  private updateFrameBoundries(boundries: IIndexSpan) {
    this._frame.start = boundries.start;
    this._frame.end = boundries.end;
    return boundries;
  }

  /**
   * Updates the frame span
   *
   * @param start
   * @param end
   * @param limit
   //  */
  private updateFramedPosition(start?: number, end?: number, limit?: number) {
    return this.updateFrameBoundries(this.checkFrameBoundries(start, end, limit));
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


  getCurrentPage() {
    return this._frame.start / this._frame.range + 1;
  }

  setCurrentPage(page: number) {
    const startIdx = (page - 1) * this._frame.range;
    const frameBoundries = this.checkFrameBoundries(startIdx);
    frameBoundries.change = this.isFrameReady(frameBoundries);
    return frameBoundries;
  }

  /**
   * Mode independent initialization of first rows
   */
  doInitialize() {
    if (this.frameMode === K_PAGED) {
      return this.doChangePage(this.getCurrentPage());
    } else if (this.frameMode === K_INFINITE) {
      return this.doChangeSpan(0, this._frame.range - 1);
    } else {
      // show all record from beginning
      return this.doChangeSpan(0);
    }
  }

  // /**
  //  * Check if max rows is fully filled with empty nodes
  //  */
  // checkFillEmptyNodes() {
  //   if (this.length < this.maxRows) {
  //     let endIdx = this.getLoadBoundries().end + this.prefillLimit;
  //     if (endIdx >= this.maxRows) {
  //       endIdx = this.maxRows - 1;
  //     }
  //     this.fillWithEmptyNode(this.getLoadBoundries().end + 1, endIdx);
  //   }
  // }

  /**
   * Change page process with observable return
   *
   * @param page
   */
  doChangePage(page: number) {
    const boundries = this.setCurrentPage(page);
    return this._doChange(boundries);
  }

  /**
   * Change offset process with observable return
   *
   * @param start
   * @param end
   */
  doChangeSpan(start: number, end?: number) {
    const frameBoundries = this.checkFrameBoundries(start, end);
    frameBoundries.change = this.isFrameReady(frameBoundries);
    return this._doChange(frameBoundries);
  }

  areBoundriesSet(boundries: IIndexSpan) {
    if (boundries.start === undefined) {
      return false;
    }
    return true;
  }

  /**
   * Change process
   *
   * TODO create a central event pipe handling frame changes
   *
   * @param isReady
   * @private
   */
  private _doChange(boundries: IIndexSpan) {
    if (!this.areBoundriesSet(boundries)) {
      return of([]);
    }

    let obs = null;
    this.updateFrameBoundries(boundries);
    if (boundries.change) {
      obs = of([]);
    } else {
      obs = this.doFrameReload(boundries);
    }
    obs = obs.pipe(
      // tap(x => console.log(x)),
      // mergeMap(v => iif(() => boundries.change, of([]), this.doFrameReload(boundries))),
      concatMap(this.doPreload.bind(this)),
      concatMap(() => this.getFrameAsArray('push', boundries)),
      toArray(),
      concatMap(this.passToValues.bind(this)),
      toArray(),
      last()
    );
    return obs;
  }

  getFrameAsArray(mode: 'push' | 'index' = 'push', boundries?: IIndexSpan): Node<T>[] {
    if (!boundries) {
      boundries = this.getFrameBoundries();
    }

    const scale = boundries.start;
    const copy: Node<T>[] = [];
    for (let i = boundries.start; i <= boundries.end; i++) {
      const idx = i - scale;
      const node = this.getNode(i);
      if (node) {
        if (mode === 'push') {
          copy.push(node);
        } else {
          copy[idx] = node;
        }
      }
    }
    return copy;
  }


  /**
   * Return only loaded elements
   */
  getLoadedAsArray(mode: 'push' | 'index' = 'push') {
    const boundries = this.getLoadBoundries();
    // const scale = boundries.start;
    const copy: Node<T>[] = [];
    for (let i = boundries.start; i <= boundries.end; i++) {
      // const idx = i - scale;
      const node = this.getNode(i);
      if (node && !node.isEmpty()) {
        if (mode === 'push') {
          copy.push(node);
        } else {
          copy[i] = node;
        }
      }
    }
    return copy;
  }

  /**
   * Copy values an notify subscriber
   *
   * @param nodes
   * @private
   */
  passToValues(nodes?: Node<T>[]) {
    if (this.frameMode === K_PAGED || this.frameMode === K_VIEW) {
      if (!nodes) {
        nodes = this.getFrameAsArray();
      }
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
    return this.doFetch({ start: check.start, end: check.end });
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
