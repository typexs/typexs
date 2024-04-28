import { range } from 'lodash';
import { ActivatedRoute, Router } from '@angular/router';
import { PagerAction } from './PagerAction';
import { Location } from '@angular/common';
import { EventEmitter as ngEventEmitter } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { Log } from '../lib/log/Log';

export class Pager {

  static inc = 0;

  readonly id: number;

  readonly name: string;

  private _inc = 0;

  private frameStart: number;

  private frameEnd: number;

  frameSize: number = 3;

  currentPage: number;

  totalPages: number;

  /**
   * Minimum pages
   */
  minPage = 1;

  /**
   * Pages for display
   */
  pages$: BehaviorSubject<number[]> = new BehaviorSubject<number[]>([]);

  emitter: { event: string; emitter: ngEventEmitter<PagerAction> }[] = [];

  /**
   * Cache subscriptions
   */
  queryListenerSubscription: Subscription = null;


  constructor(
    private location: Location,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    id: string = 'dummy') {
    this.name = id;
    this.id = Pager.inc++;
  }

  /**
   * Register callback for some event
   */
  register(eventName: string, emitter: ngEventEmitter<PagerAction>) {
    const _exists = this.emitter.find(x => x.event === eventName && (x.emitter === emitter));
    if (!_exists) {
      this.emitter.push({ event: eventName, emitter: emitter });
      this.listenForQueryParam();
    }
  }

  listenForQueryParam() {
    if (this.queryListenerSubscription) {
      return;
    }
    this.queryListenerSubscription = this.activatedRoute.queryParamMap.subscribe(value => {
      if (value.has(this.name)) {
        const _value = value.get(this.name);
        if (/^\d+$/.test(_value)) {
          const nr = parseInt(_value, 10);
          if (this.currentPage !== nr) {
            this.setPage(nr);
          }
        }
      }
    });
  }

  calculatePages() {
    if (this.minPage > 0 && this.totalPages > 0) {

      if (this.currentPage > this.totalPages) {
        this.currentPage = this.totalPages;
      }

      this.frameStart = this.currentPage - this.frameSize;
      this.frameEnd = this.currentPage + this.frameSize;
      if (this.frameStart < 1) {
        this.frameEnd += Math.abs(this.frameStart) + 1;
        this.frameStart = 1;
      }

      if (this.frameEnd > this.totalPages) {
        this.frameEnd = this.totalPages;
        this.frameStart = this.frameStart - (this.frameEnd - this.totalPages);
      }

      if (this.minPage <= this.frameStart &&
        this.frameStart <= this.currentPage &&
        this.currentPage <= this.frameEnd &&
        this.frameEnd <= this.totalPages) {
        const page = range(this.frameStart, this.frameEnd + 1);
        this.pages$.next(page);
        this.updateUrl(this.currentPage);
      } else {
        throw new Error('pager error' +
          ' min=' + this.minPage +
          ' start=' + this.frameStart +
          ' current=' + this.currentPage +
          ' end=' + this.frameEnd +
          ' total=' + this.totalPages);
      }
    }
  }


  checkQueryParam() {
    if (!this.activatedRoute || !this.activatedRoute.snapshot) {
      return false;
    }
    const pagerValue = this.activatedRoute.snapshot.queryParamMap.has(this.name);
    if (pagerValue) {
      const page = this.activatedRoute.snapshot.queryParamMap.get(this.name);
      if (/^\d+$/.test(page)) {
        try {
          this.setPage(parseInt(page, 10));
          return true;
        } catch (e) {
          Log.error(e);
        }
      }
    }
    return false;
  }


  setPage(nr: number, force = false) {
    if ((0 < nr && nr <= this.totalPages && nr !== this.currentPage) || force) {
      this.currentPage = nr;
      this.calculatePages();
      const action = new PagerAction(this.currentPage, this.name);
      this.emitter.filter(x => x.event === 'page_action').forEach(x => {
        x.emitter.emit(action);
      });
    } else {
      if (typeof this.currentPage === 'number' && nr !== this.currentPage) {
        throw new Error('pager is out of range ' + nr + ' of maxlines ' + this.totalPages);
      }
    }
  }

  updateUrl(page: number) {
    const params: any = {
      [this.name]: undefined
    };
    if (page > 0) {
      params[this.name] = page;
    }
    if (this.router) {
      const urlTree = this.router.createUrlTree([], {
        queryParams: params,
        queryParamsHandling: 'merge',
        preserveFragment: true
      });
      this.location.replaceState(urlTree.toString());
    }
  }


  hasLeftSpace() {
    return this.minPage < this.frameStart;
  }


  hasRightSpace() {
    return this.frameEnd < this.totalPages;
  }

  isNotFrameFirst() {
    return this.currentPage > this.minPage;
  }


  isNotFrameLast() {
    return !(this.currentPage < this.totalPages);
  }

  inc() {
    this._inc++;
  }

  dec() {
    this._inc--;
  }

  reset() {
    this.totalPages = 0;
    this.pages$.next([]);
    this.currentPage = 1;
    this.updateUrl(0);
  }

  canBeFreed() {
    return this._inc <= 0;
  }

  free() {
    // this.removeAllListeners();
    this.router = null;
    this.activatedRoute = null;
    this.emitter = [];
    if (this.queryListenerSubscription) {
      this.queryListenerSubscription.unsubscribe();
      this.queryListenerSubscription = null;
    }
  }

  calculate(offset: number, limit: number, maxRows: number) {
    this.totalPages = Math.ceil(maxRows * 1.0 / limit * 1.0);
    // if (!this.checkQueryParam()) {
    this.currentPage = (offset / limit) + 1;
    this.calculatePages();
    // }
  }

  hasPages() {
    return this.pages$.getValue().length > 0;
  }
}
