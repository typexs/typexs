import { get, mean, set } from 'lodash';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Inject, Renderer2 } from '@angular/core';
import { AbstractGridComponent } from '../api/abstract-grid.component';
import { PagerService } from '../../pager/PagerService';
import { IGridColumn } from '../api/IGridColumn';
import { Eq, ExprDesc, Like, Value, ValueDesc } from '@allgemein/expressions';
import { ISimpleTable } from './ISimpleTable';
import { DOCUMENT } from '@angular/common';
import { Log } from '../../lib/log/Log';
import { fromEvent, Observable, Subscription } from 'rxjs';
import { debounce, debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { IGridMode, K_INFINITE, K_PAGED, K_VIEW } from '../api/IGridMode';


/**
 * TODO:
 *
 * - loading when data is fetched
 */

@Component({
  selector: 'txs-simple-html-table',
  templateUrl: 'simple-html-table.component.html',
  styleUrls: ['./simple-html-table.component.scss']
})
export class SimpleHtmlTableComponent extends AbstractGridComponent implements ISimpleTable {

  filterOpened: string = null;

  filterValue: any = null;

  /**
   * Mark if mouse or cursor is over the component
   */
  // cursorFocuses = false;

  // private unlistenMouseEnter: () => void;

  // private unlistenMouseLeave: () => void;

  // private scrollObservable: Observable<any>;

  // private scrollSubscription: Subscription;


  constructor(
    private pagerService: PagerService,
    private changeRef: ChangeDetectorRef
    /**
     @Inject(DOCUMENT) private document: Document,
      private elemRef: ElementRef,
      private renderer2: Renderer2
     */
  ) {
    super(pagerService, changeRef);
  }

  getSelf(): ISimpleTable {
    return this;
  }


  addNewRow() {
    // TODO
  }

  supportedModes(): IGridMode[] {
    return [
      { name: K_VIEW, label: K_VIEW },
      { name: K_PAGED, label: K_PAGED }
    ];
  }


  /**
   * Called by ngInit
   */
  initialize() {
    super.initialize();

    // if (this.unlistenMouseLeave) {
    //   this.unlistenMouseLeave();
    // }
    // if (this.unlistenMouseEnter) {
    //   this.unlistenMouseEnter();
    // }

    if (this.options.mode) {
      switch (this.options.mode) {
        // case 'infinite':
        //   this.onInfiniteMode();
        //   break;
        case 'paged':
          this.onPagedMode();
          break;
      }
    }
  }

  // ngAfterViewInit() {
  //   // if (this.getGridModeName() === K_INFINITE) {
  //   //   // check if clientView is filled
  //   //
  //   //   // on infinite calculate scollHeight
  //   //   // this.calcScrollHeight();
  //   // }
  //
  // }


  // /**
  //  * Attach infinite scrolling relevent event listener
  //  *
  //  * - scroll listener should be only listening when mouse is over the component
  //  * - scroll in div or append at the end
  //  */
  // private onInfiniteMode() {
  //   this.options.enablePager = false;
  //   this.cursorFocuses = false;
  //   this.unlistenMouseEnter = this.renderer2.listen(this.getTableElement(), 'mouseenter', this.onMouseEnter.bind(this));
  //   this.scrollObservable = fromEvent(this.getScrollElement(), 'scroll')
  //     .pipe(
  //       debounceTime(100),
  //       map(() => this.getScrollElement().scrollTop),
  //       distinctUntilChanged());
  // }
  //

  private onPagedMode() {
    this.options.enablePager = true;
  }

  // private onMouseEnter() {
  //   this.cursorFocuses = true;
  //   this.unlistenMouseLeave = this.renderer2.listen(this.getTableElement(), 'mouseleave', this.onMouseLeave.bind(this));
  //   this.scrollSubscription = this.scrollObservable.subscribe(this.onScroll.bind(this));
  // }
  //
  // private onMouseLeave() {
  //   Log.info('leave');
  //   this.cursorFocuses = false;
  //   // this.unlistenMouseEnter();
  //   this.scrollSubscription.unsubscribe();
  //   this.unlistenMouseLeave();
  // }
  //
  // getBoundries(elem: HTMLElement) {
  //   return elem.getBoundingClientRect();
  // }
  //
  //
  // getTableElement(): HTMLElement {
  //   return this.elemRef.nativeElement;
  // }
  //
  // getScrollElement(): HTMLElement {
  //   return this.getTableElement().querySelector('tbody');
  // }
  //
  //
  // private onScroll(event: Event) {
  //   const tbody = this.getScrollElement();
  //   const viewTop = tbody.scrollTop;
  //   const viewBottom = viewTop + tbody.clientHeight;
  //
  //   const elements = this.getElementsInViewPort(tbody, viewTop, viewBottom);
  //   const placeholder = elements.filter(x => x.classList.contains('placeholder'));
  //   if (placeholder.length > 0) {
  //     const first = elements[0];
  //     const last = elements[elements.length - 1];
  //
  //     const startIdxAttr = first.getAttribute('idx');
  //     const endIdxAttr = last.getAttribute('idx');
  //
  //     let startIdx = parseInt(startIdxAttr, 10);
  //     let endIdx = parseInt(endIdxAttr, 10);
  //
  //     if (startIdx > 0) {
  //       startIdx = startIdx - 1;
  //     }
  //
  //     if (endIdx > 0) {
  //       endIdx = endIdx + 1;
  //
  //       if (endIdx >= this.maxRows) {
  //         endIdx = this.maxRows - 1;
  //       }
  //     }
  //
  //     this.getDataNodes().doChangeSpan(startIdx, endIdx).subscribe(x => {
  //     });
  //
  //   }
  //
  //
  //   // const scrollBottomOffset = tbody.scrollHeight - tbody.offsetHeight;
  //   // const bottomReached = scrollBottomOffset - tbody.scrollTop <= 0;
  //   // const topReached = tbody.scrollTop < tbody.offsetHeight / 2.;
  //   // Log.info('scroll', scrollBottomOffset, tbody.scrollTop, tbody.scrollHeight, bottomReached, topReached, this.getBoundries(tbody));
  //   // // this.elemRef.nativeElement as HT
  //   //
  //   // if (bottomReached) {
  //   //   this.onBottomReached();
  //   // }
  // }
  //
  // getElementsInViewPort(tbody: HTMLElement, viewTop: number, viewBottom: number) {
  //   const elements = [];
  //   for (let i = 0; i < tbody.childNodes.length; i++) {
  //     const tr = tbody.childNodes.item(i) as HTMLElement;
  //     if (tr.offsetTop >= viewTop && (tr.offsetTop + tr.clientHeight) <= viewBottom) {
  //       elements.push(tr);
  //     } else {
  //       if (elements.length > 0) {
  //         break;
  //       }
  //     }
  //
  //   }
  //   return elements;
  // }
  //
  //
  // getCurrentScrollViewYBoundries() {
  //   const scrollElement = this.getScrollElement();
  //   // get offset to table
  //   let offsetRootTop = scrollElement.offsetTop;
  //   if (scrollElement.tagName.toLocaleLowerCase() === 'tbody') {
  //     // need thead for offset calulation if exists
  //     const theadElem = scrollElement.parentElement.querySelector('thead');
  //     if (theadElem) {
  //       offsetRootTop += theadElem.offsetTop;
  //     }
  //   }
  //   // const scrollBounds = scrollElement.getBoundingClientRect();
  //   const viewTop = scrollElement.scrollTop;
  //   const viewBottom = scrollElement.scrollTop + scrollElement.clientHeight;
  //
  //   return {
  //     top: viewTop,
  //     bottom: viewBottom,
  //     offsetTop: offsetRootTop
  //   };
  // }
  //
  // getElementsInScrollView() {
  //   const scrollElement = this.getScrollElement();
  //   const boundries = this.getCurrentScrollViewYBoundries();
  //   // const start = false;
  //   const viewTop = boundries.top;
  //   const viewBottom = boundries.bottom;
  //   const offsetRootTop = boundries.offsetTop;
  //   const ret: any = {
  //     top: viewTop,
  //     height: boundries.bottom - viewTop,
  //     meanEntryHeight: 0,
  //     bottom: viewBottom,
  //     entries: []
  //   };
  //   const elements = [];
  //   for (let i = 0; i < scrollElement.childNodes.length; i++) {
  //     const x = scrollElement.childNodes.item(i) as HTMLElement;
  //     if (x) {
  //       if (x.classList && x.classList.contains('placeholder')) {
  //         break;
  //       }
  //       const offsetTop = x.offsetTop - offsetRootTop;
  //       if (viewTop <= offsetTop && offsetTop <= viewBottom) {
  //         const z: any = {
  //           top: offsetTop,
  //           bottom: offsetTop + x.offsetHeight,
  //           entry: x
  //         };
  //         z.height = z.bottom - z.top;
  //         if (ret.entries.length > 0) {
  //           z.paddingTop = z.top - ret.entries[ret.entries.length - 1].bottom;
  //         }
  //         ret.entries.push(z);
  //       } else if (elements.length > 0) {
  //         break;
  //       }
  //     }
  //   }
  //
  //   const heights = ret.entries.filter((x: any) => typeof x.height !== 'undefined').map((x: any) => x.height);
  //   const paddingTops = ret.entries.filter((x: any) => typeof x.paddingTop !== 'undefined').map((x: any) => x.paddingTop);
  //
  //   ret.meanEntryHeight = mean(heights);
  //   ret.meanEntryPadding = mean(paddingTops);
  //
  //   if (ret.entries.length > 0) {
  //     const first = ret.entries[0];
  //     const last = ret.entries[ret.entries.length - 1];
  //     ret.firstTop = first.top;
  //     ret.lastBottom = last.bottom;
  //     ret.startIdx = parseInt(first.entry.getAttribute('idx'), 10);
  //     ret.endIdx = parseInt(last.entry.getAttribute('idx'), 10);
  //     const bottomEmptySpace = ret.lastBottom - ret.firstTop;
  //     const missing = ret.bottom - ret.top - bottomEmptySpace;
  //     ret.possibleAdditional = 0;
  //     if (missing > 0) {
  //       const amount = missing / (ret.meanEntryHeight + ret.meanEntryPadding);
  //       if (amount > 0) {
  //         ret.possibleAdditional = Math.ceil(amount);
  //       }
  //     }
  //   }
  //
  //   return ret;
  // }
  //
  //
  // private onBottomReached() {
  //   // check if data nodes
  //   // this.getDataNodes().nextView();
  // }
  //
  //
  // checkIfLoadNeeded() {
  //   if (this.getDataNodes().isReachedMaxRows()) {
  //     return;
  //   }
  //   const tbody = this.getScrollElement();
  //
  //   const firstElem = tbody.querySelector('tr:first-child');
  //   const lastElem = tbody.querySelector('tr:not(.placeholder):last-child');
  //
  //   // this.getDataNodes().fetch()
  //   const offsetTop = tbody.scrollTop;
  //   const offsetBottom = tbody.scrollTop + tbody.offsetHeight;
  //   const lastBottom = lastElem.clientTop + lastElem.clientHeight;
  //
  //   if (lastBottom < offsetBottom) {
  //     // new records to load
  //     // this.getDataNodes().fetchNext();
  //   } else {
  //     // no need to load
  //   }
  // }


  // @HostListener('mouseenter')
  // @HostListener('mouseleave')
  // switchScroll()

  // /**
  //  * Is insertable
  //  */
  // isInsertable() {
  //   return this.options.insertable;
  // }
  //
  // /**
  //  * Is editable
  //  */
  // isEditable() {
  //   return this.options.editable;
  // }
  //
  // /**
  //  * Is deletable
  //  */
  // isDeletable() {
  //   return this.options.deletable;
  // }

  // /**
  //  * Save will call an event on
  //  *
  //  * @param type
  //  */
  // doCreate() {
  //   // if (has(this.options, 'crudCallbacks.doCreate')) {
  //   //   this.options.crudCallbacks
  //   //     .doCreate()
  //   //     .subscribe();
  //   // } else {
  //   //
  //   // }
  //
  //   // we need a two way binding
  //   this.gridReady.emit({
  //     event: 'create',
  //     api: this,
  //     data: {}
  //   });
  // }


  isSorted(column: IGridColumn, sort: 'asc' | 'desc' | 'none') {
    if (!column.sorting) {
      return false;
    }
    const _sort = get(this.params.sorting, column.field);
    if (!_sort && sort === 'none') {
      return true;
    } else if (_sort === sort) {
      return true;
    }
    return false;
  }


  doSort(column: IGridColumn) {
    if (!this.params.sorting) {
      this.params.sorting = {};
    }
    const _sort = get(this.params.sorting, column.field);
    if (_sort) {
      if (_sort === 'asc') {
        set(this.params.sorting, column.field, 'desc');
      } else {
        delete this.params.sorting[column.field];
      }
    } else {
      set(this.params.sorting, column.field, 'asc');
    }
    this.paramsChange.emit(this.params);
    this.doQuery.emit(this);
  }


  openFilter(column: IGridColumn) {
    this.filterOpened = column.field;
    const filter: ExprDesc = get(this.params.filters, column.field);
    if (filter) {
      this.filterValue = filter.value instanceof ValueDesc ? filter.value.value : filter.value;
    } else {
      this.filterValue = null;
    }
  }


  closeFilter(column: IGridColumn) {
    if (!this.params.filters) {
      this.params.filters = {};
    }
    if (this.filterValue) {

      let value: any = null;
      switch (column.filterDataType) {
        case 'date':
          value = new Date(this.filterValue);
          break;
        case 'double':
          value = parseFloat(this.filterValue);
          break;
        case 'number':
          value = parseInt(this.filterValue, 10);
          break;
        default:
          value = this.filterValue;
      }

      switch (column.filterType) {
        case 'contains':
          set(this.params.filters, column.field, Like(column.field, Value(value)));
          break;
        case 'suggest':
        case 'equal':
        default:
          set(this.params.filters, column.field, Eq(column.field, Value(value)));
          break;
      }
    } else {
      delete this.params.filters[column.field];
    }
    this.paramsChange.emit(this.params);
    this.filterOpened = null;
    this.doQuery.emit(this);
  }


  reset() {
    if (this.hasPager()) {
      this.getPager().reset();
    }
    this.params.offset = 0;
  }


  ngOnDestroy(): void {
    this.reset();
    if (this.hasPager()) {
      if(this.getPager().canBeFreed()){

      }
    }

  }


}
