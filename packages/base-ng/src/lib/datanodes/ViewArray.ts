import { DataNodeIterator } from './DataNodeIterator';
import { BehaviorSubject, Subject, Subscription } from 'rxjs';

export class ViewArray<T> extends Array<T> {

  /**
   * Start of shown idx
   */
  private _viewStartIdx: number = 0;

  /**
   * End of shown idx
   */
  private _viewEndIdx: number = 0;

  /**
   * Limit of entries to show
   */
  private _limit: number = 25;

  /**
   * Max row count
   */
  private _maxRows: number;


  /**
   * Values selected for the view frame
   *
   * @private
   */
  private values$: BehaviorSubject<T[]> = new BehaviorSubject<T[]>([]);

  /**
   * Marks if value should be recreated
   *
   * @private
   */
  private dirty$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  private subscriptions: Subscription;

  constructor(...x: T[]) {
    super(...x);
    this.subscriptions = this.dirty$.subscribe(x => {
      if (x) {
        this.calcView();
      }
    });
    if (x.length > 0) {
      this.markAsDirty();
    }
  }

  calcView() {
    this.viewEndIdx = this.viewStartIdx + this.limit;
    this.values$.next(Array.from(new DataNodeIterator<T>(this)));
    this.clearDirtyMark();
  }

  clear() {
    this.splice(0, this.length);
    this._viewStartIdx = 0;
    this._viewEndIdx = 0;
    this.clearDirtyMark();
  }

  push(...items: T[]): number {
    const num = super.push(...items);
    this.markAsDirty();
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
    this.calcView();
  }

  get offset(): number {
    return this.viewStartIdx;
  }

  set offset(offset: number) {
    this.viewStartIdx = offset;
    this.calcView();
  }

  get viewStartIdx(): number {
    return this._viewStartIdx;
  }

  set viewStartIdx(idx: number) {
    this._viewStartIdx = idx;
  }

  get viewEndIdx(): number {
    return this._viewEndIdx;
  }

  set viewEndIdx(idx: number) {
    this._viewEndIdx = idx;
  }

  /**
   * Mark array as dirty if not already done
   */
  markAsDirty() {
    if (!this.dirty$.getValue()) {
      this.dirty$.next(true);
    }
  }

  /**
   * Reset dirty status
   */
  clearDirtyMark() {
    if (this.dirty$.getValue()) {
      this.dirty$.next(false);
    }
  }

  /**
   * Return status if the array is dirty
   */
  isDirty() {
    return this.dirty$.getValue();
  }

  destroy() {
    this.subscriptions.unsubscribe();
  }

}
