import { isNumber, isString, isUndefined } from 'lodash';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { PagerAction } from './PagerAction';
import { PagerService } from './PagerService';
import { Pager } from './Pager';

@Component({
  selector: 'txs-pager',
  templateUrl: 'pager.component.html',
  styleUrls: ['./pager.component.scss']
})
export class PagerComponent implements OnInit, OnDestroy {

  /**
   * Query identifier name for this pager
   */
  @Input()
  name = 'pager';


  /**
   * Emit events on pagechanges
   */
  @Output()
  pageChange: EventEmitter<PagerAction> = new EventEmitter<PagerAction>();


  _frameSize: number = 3;


  /**
   * Frame Size
   */
  get frameSize() {
    return this.pager && this.pager.frameSize > 0 ? this.pager.frameSize : this._frameSize;
  }

  @Input()
  set frameSize(nr: number) {
    nr = isNumber(nr) ? nr : parseInt(nr, 10);
    if (this.pager) {
      this.pager.frameSize = nr;
    } else {
      this._frameSize = nr;
    }
  }

  _currentPage: number;

  /**
   * Current page
   */
  get currentPage() {
    return this.pager ? this.pager.currentPage : this._currentPage;
  }

  @Input()
  set currentPage(nr: number) {
    nr = isNumber(nr) ? nr : parseInt(nr, 10);
    if (this.pager) {
      this.pager.currentPage = nr;
    } else {
      this._currentPage = nr;
    }
  }

  _totalPages: number;

  /**
   * Maximum pages
   */
  get totalPages() {
    return this.pager ? this.pager.totalPages : this._totalPages;
  }


  @Input()
  set totalPages(nr: number) {
    nr = isNumber(nr) ? nr : parseInt(nr, 10);
    if (this.pager) {
      this.pager.totalPages = nr;
    } else {
      this._totalPages = nr;
    }
  }

  @Input()
  pager: Pager;

  constructor(
    private pagerService: PagerService) {
  }

  hasPages() {
    return this.pager.pages$.getValue() && this.pager.pages$.getValue().length > 0;
  }


  checkTotal() {
    if (!this.totalPages) {
      this.totalPages = 0;
    } else {
      if (isString(this.totalPages)) {
        this.totalPages = parseInt(this.totalPages, 10);
      }
    }
  }


  checkCurrent() {
    if (!this.currentPage) {
      this.currentPage = 1;
    } else {
      if (isString(this.currentPage)) {
        this.currentPage = parseInt(this.currentPage, 10);
      }
    }
  }

  checkFrameSize() {
    if (!this.frameSize) {
      this.frameSize = 1;
    } else {
      if (isString(this.frameSize)) {
        this.frameSize = parseInt(this.frameSize, 10);
      }
    }
  }


  ngOnInit(): void {
    let exists = true;
    if (!this.pager) {
      this.pager = this.pagerService.get(this.name);
      exists = false;
    }

    // Update fields if they where already
    if (!isUndefined(this._totalPages)) {
      this.totalPages = this._totalPages;
    }

    if (!isUndefined(this._currentPage)) {
      this.currentPage = this._currentPage;
    }

    if (!isUndefined(this._frameSize)) {
      this.frameSize = this._frameSize;
    }

    if (this.pageChange.observers.length > 0) {
      this.pager.register('page_action', this.pageChange);
      // this.pager.setPage(1, true);
    }

    if (exists) {
      return;
    }
    this.checkCurrent();
    this.checkTotal();
    this.checkFrameSize();
  }


  ngOnDestroy(): void {
    this.pager = undefined;
    this.pagerService.remove(this.name);
  }
}
