import { DataNodeIterator } from './DataNodeIterator';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { Log } from '../log/Log';
import { isArray } from 'lodash';


/**
 * ViewArray extend an array and add some feature
 *
 * - callback on reaching limit
 * - cleanup cached values
 */
export class ViewArray<T> extends Array<T> {

  /**
   * Start of shown idx
   */
  private _startIdx: number = 0;

  /**
   * End of shown idx
   */
  private _endIdx: number = 0;

  /**
   * Limit of entries to show
   */
  private _limit: number = 25;

  /**
   * Max row count
   */
  private _maxRows: number;

  /**
   * Callback for extern data provider
   *
   * @private
   */
  private _fn: (startIdx: number, endIdx: number) => Observable<T[]>;

  /**
   * Values selected for the view frame
   *
   * @private
   */
  private values$: BehaviorSubject<T[]> = new BehaviorSubject<T[]>([]);

  // /**
  //  * Marks if value should be recreated
  //  *
  //  * @private
  //  */
  // private dirty$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  /**
   * TODO: Cache only this amount of nodes, cleanup first if scrolling down and last when scrolling up.
   *
   * If set to -1 ignore caching.
   *
   * @private
   */
  private cacheLimit = 1000;

  /**
   * TODO: Number of records which should be prefetched
   *
   * @private
   */
  private preFetch = 100;

  // /**
  //  * Register subscription for correct cleanup
  //  *
  //  * @private
  //  */
  // private subscriptions: Subscription;

  constructor(...x: T[]) {
    super(...x);
    // this.subscriptions = this.dirty$.subscribe(x => {
    //   if (x) {
    //     this.resetIdx();
    //     this.nextView();
    //   }
    // });
    // if (x.length > 0) {
    //   this.markAsDirty();
    // }
  }


  /**
   * Calculate next view
   *
   * - checks if maxRows reached if present
   */
  nextView() {
    this.startIdx = this.endIdx;
    if (typeof this.maxRows === 'number') {
      if (this.endIdx + this.limit < this.maxRows) {
        this.endIdx = this.startIdx + this.limit;
      } else {
        this.endIdx = this.maxRows;
      }
    } else {
      // no max rows do not check if limit reached
      this.endIdx = this.startIdx + this.limit;
    }
    this.updateView();
  }

  /**
   * Calculate previous view
   */
  previousView() {
    this.endIdx = this.startIdx;
    if (this.startIdx - this.limit >= 0) {
      this.startIdx = this.startIdx - this.limit;
    } else {
      this.startIdx = 0;
    }
    this.updateView();
  }


  /**
   * Update subscriber with new data
   */
  updateView() {
    // this.checkForUndefined()
    this.values$.next(Array.from(new DataNodeIterator<T>(this)));
  }


  /**
   * Set view manually
   *
   * @param startIdx
   * @param endIdx
   */
  setView(startIdx: number = 0, endIdx?: number, limit?: number) {
    if (typeof limit === 'number') {
      this.limit = limit;
    }
    this.startIdx = startIdx;
    this.endIdx = typeof endIdx === 'number' ? endIdx : this.startIdx + this.limit;
    this.updateView();
  }

  /**
   *  Reset view to first
   */
  resetView() {
    this.resetIdx();
    this.updateView();
  }

  /**
   * Reset idx values
   */
  resetIdx() {
    this.startIdx = 0;
    this.endIdx = this.startIdx + this.limit;
  }

  /**
   * Check if limit is keept, return distance
   */
  isLimitKeept() {
    const endIdx = this.startIdx + this.limit;
    if (endIdx === this.endIdx) {
      return 0;
    } else {
      return this.endIdx - endIdx;
    }
  }

  /**
   * Reset array to zero elements
   */
  reset() {
    this.splice(0, this.length);
    this.resetIdx();
    // this.clearDirtyMark();
  }

  push(...items: T[]): number {
    const num = super.push(...items);
    // this.markAsDirty();
    return num;
  }


  getValues() {
    return this.values$;
  }

  get maxRows() {
    return this._maxRows;
  }

  set maxRows(maxRows: number) {
    this._maxRows = maxRows;
  }

  get limit(): number {
    return this._limit;
  }

  set limit(limit: number) {
    this._limit = limit;
    this.setView();
  }

  get offset(): number {
    return this.startIdx;
  }

  set offset(offset: number) {
    this.startIdx = offset;
    this.setView(this.startIdx);
  }

  get startIdx(): number {
    return this._startIdx;
  }

  set startIdx(idx: number) {
    this._startIdx = idx;
  }

  get endIdx(): number {
    return this._endIdx;
  }

  set endIdx(idx: number) {
    this._endIdx = idx;
  }

  /**
   * Is max rows reached
   */
  isReachedMaxRows() {
    if (typeof this.maxRows === 'number') {
      return super.length >= this.maxRows;
    }
    return false;
  }

  /**
   * Check if a value is set on an special idx
   *
   * @param idx
   */
  isValueSet(idx: number) {
    return super[idx];
  }

  // /**
  //  * Mark array as dirty if not already done
  //  */
  // markAsDirty() {
  //   if (!this.dirty$.getValue()) {
  //     this.dirty$.next(true);
  //   }
  // }

  // /**
  //  * Reset dirty status
  //  */
  // clearDirtyMark() {
  //   if (this.dirty$.getValue()) {
  //     this.dirty$.next(false);
  //   }
  // }

  // /**
  //  * Return status if the array is dirty
  //  */
  // isDirty() {
  //   return this.dirty$.getValue();
  // }

  /**
   * Finalize array
   */
  destroy() {
    // this.subscriptions.unsubscribe();
    this.setNodeCallback(undefined);
  }

  /**
   * Set callback for retrieving data from extern source
   *
   * @param fn
   */
  setNodeCallback(fn: (startIdx: number, endIdx: number) => Observable<T[]>) {
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
  fetch(startIdx: number, endIdx: number) {
    if (!this.hasNodeCallback()) {
      throw new Error('No callback for fetching node data defined.');
    }
    const sub = this._fn(startIdx, endIdx).subscribe(values => {
      if (isArray(values)) {
        this.applyFetchData(startIdx, values);
      }
    }, error => {
      Log.error(error);
    }, () => {
      setTimeout(() => sub.unsubscribe());
    });
  }


  /**
   * Add data to array
   *
   * @param startIdx
   * @param nodes
   */
  applyFetchData(startIdx: number, nodes: T[]) {
    // check if size
    let posIdx = startIdx;
    for (const val of nodes) {
      super[posIdx++] = val;
    }
  }

  /**
   * Count how many undefined values are present
   *
   * @param startIdx
   * @param endIdx
   *
   */
  checkForUndefined(startIdx: number, limit: number, dir: 'forward' | 'backward' = 'forward') {
    let undefinedCount = 0;
    if (startIdx >= this.length || startIdx < 0) {
      // out of bound
      return -1;
    }
    if (dir === 'backward') {
      const bottom = startIdx - limit > 0 ? startIdx - limit : 0;
      for (let i = startIdx; i >= bottom; i--) {
        if (super[i] === undefined) {
          undefinedCount++;
        }
      }
    } else {
      const top = startIdx + limit < this.length ? startIdx + limit : this.length;
      for (let i = startIdx; i < top; i++) {
        if (super[i] === undefined) {
          undefinedCount++;
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
    for (const [idx, t] of this.entries()) {
      copy[idx] = t;
    }
    return copy;
  }

}
