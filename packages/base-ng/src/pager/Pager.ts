import {range} from 'lodash';
import {ActivatedRoute, Router} from '@angular/router';
import {PagerAction} from './PagerAction';
import {EventEmitter} from 'events';


export class Pager extends EventEmitter {

  static inc = 0;

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
  pages: number[] = [];

  wait: NodeJS.Timer;

  constructor(private router: Router, private activatedRoute: ActivatedRoute, id: string = 'dummy') {
    super();
    this.name = id;

  }


  doOnce(fn: () => void) {
    clearTimeout(this.wait);
    this.wait = setTimeout(fn, 50);
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
        this.pages = range(this.frameStart, this.frameEnd + 1);
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
          this.setPage(parseInt(page, 0));
          return true;
        } catch (e) {
        }
      }

    }
    return false;
  }


  setPage(nr: number) {
    if (0 < nr && nr <= this.totalPages && nr !== this.currentPage) {
      this.doOnce(() => {
        this.currentPage = nr;

        this.calculatePages();

        const action = new PagerAction(this.currentPage, this.name);
        this.emit('page_action', action);

        this.updateUrl();
      });
    } else {
      throw new Error('pager is out of range ' + nr + ' of maxlines ' + this.totalPages);
    }
  }

  updateUrl() {
    const params: any = {};
    params[this.name] = this.currentPage;

    const urlTree = this.router.createUrlTree([], {
      queryParams: params,
      queryParamsHandling: 'merge',
      preserveFragment: true
    });

    this.router.navigateByUrl(urlTree);
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
    this.currentPage = 1;
    this.updateUrl();
  }

  free() {
    this.removeAllListeners();
    this.router = null;
    this.activatedRoute = null;
    return this._inc <= 0;
  }
}
