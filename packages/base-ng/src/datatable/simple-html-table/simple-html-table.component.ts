import { get, set } from 'lodash';
import { ChangeDetectorRef, Component, ElementRef, Inject, Renderer2 } from '@angular/core';
import { AbstractGridComponent } from '../abstract-grid.component';
import { PagerService } from '../../pager/PagerService';
import { IGridColumn } from '../IGridColumn';
import { Eq, ExprDesc, Like, Value, ValueDesc } from '@allgemein/expressions';
import { ISimpleTable } from './ISimpleTable';
import { DOCUMENT } from '@angular/common';
import { Log } from '../../lib/log/Log';


@Component({
  selector: 'txs-simple-html-table',
  templateUrl: 'simple-html-table.component.html',
  styleUrls: ['./simple-html-table.component.scss']
})
export class SimpleHtmlTableComponent extends AbstractGridComponent implements ISimpleTable {

  filterOpened: string = null;

  filterValue: any = null;

  editing: { insert: boolean } = { insert: false };

  newRows: any[] = [];

  /**
   * Mark if mouse or cursor is over the component
   */
  cursorFocuses = false;

  private unlistenMouseEnter: () => void;

  private unlistenMouseLeave: () => void;

  private unlistenMouseScroll: () => void;


  constructor(
    private pagerService: PagerService,
    private changeRef: ChangeDetectorRef,
    @Inject(DOCUMENT) private document: Document,
    private elemRef: ElementRef,
    private renderer2: Renderer2) {
    super(pagerService, changeRef);
  }

  getSelf(): ISimpleTable {
    return this;
  }


  addNewRow() {
    // TODO
  }


  /**
   * Called by ngInit
   */
  initialize() {
    super.initialize();

    if (this.unlistenMouseLeave) {
      this.unlistenMouseLeave();
    }
    if (this.unlistenMouseEnter) {
      this.unlistenMouseEnter();
    }

    if (this.options.mode) {
      switch (this.options.mode) {
        case 'infinite':
          this.onInfiniteMode();
          break;
        case 'paged':
          this.onPagedMode();
          break;
      }
    }
  }

  /**
   * Attach infinite scrolling relevent event listener
   *
   * - scroll listener should be only listening when mouse is over the component
   * - scroll in div or append at the end
   */
  private onInfiniteMode() {
    this.options.enablePager = false;
    this.cursorFocuses = false;
    this.unlistenMouseEnter = this.renderer2.listen(this.getTableElement(), 'mouseenter', this.onMouseEnter.bind(this));
  }


  private onPagedMode() {
    this.options.enablePager = true;
  }

  private onMouseEnter() {
    Log.info('enter');
    this.cursorFocuses = true;
    this.unlistenMouseScroll = this.renderer2.listen(this.getTableBodyElement(), 'scroll', this.onScroll.bind(this));
    this.unlistenMouseLeave = this.renderer2.listen(this.getTableElement(), 'mouseleave', this.onMouseLeave.bind(this));
  }

  getBoundries(elem: HTMLElement) {
    return elem.getBoundingClientRect();
  }


  getTableElement(): HTMLElement {
    return this.elemRef.nativeElement;
  }

  getTableBodyElement(): HTMLElement {
    return this.getTableElement().querySelector('tbody');
  }

  private onScroll(event: MouseEvent) {
    const tbody = this.getTableBodyElement();
    const scrollBottomOffset = tbody.scrollHeight - tbody.offsetHeight;
    const bottomReached = scrollBottomOffset - tbody.scrollTop <= 0;
    const topReached = tbody.scrollTop < tbody.offsetHeight / 2.;
    Log.info('scroll', scrollBottomOffset, tbody.scrollTop, tbody.scrollHeight, bottomReached, topReached, this.getBoundries(tbody));
    // this.elemRef.nativeElement as HT

    if (bottomReached) {
      this.onBottomReached();
    }

  }

  private onBottomReached() {
    // check if data nodes
    // this.getDataNodes().nextView();
  }

  private onMouseLeave() {
    Log.info('leave');
    this.cursorFocuses = false;
    // this.unlistenMouseEnter();
    this.unlistenMouseLeave();
    this.unlistenMouseScroll();
  }


  // @HostListener('mouseenter')
  // @HostListener('mouseleave')
  // switchScroll()

  /**
   * Is insertable
   */
  isInsertable() {
    return this.options.insertable;
  }

  /**
   * Is editable
   */
  isEditable() {
    return this.options.editable;
  }

  /**
   * Is deletable
   */
  isDeletable() {
    return this.options.deletable;
  }

  /**
   * Save will call an event on
   *
   * @param type
   */
  doCreate() {
    // if (has(this.options, 'crudCallbacks.doCreate')) {
    //   this.options.crudCallbacks
    //     .doCreate()
    //     .subscribe();
    // } else {
    //
    // }

    // we need a two way binding
    this.gridReady.emit({
      event: 'create',
      api: this,
      data: {}
    });
  }


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
    if(this.pager){
      this.pager.reset();
    }
    this.params.offset = 0;
  }


  ngOnDestroy(): void {
    this.reset();
    if (this.pager) {
      this.pager.free();
    }

  }


}
