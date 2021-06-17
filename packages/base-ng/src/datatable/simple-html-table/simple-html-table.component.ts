import {defaults, get, isEmpty, isNumber, set} from 'lodash';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {AbstractGridComponent} from '../abstract-grid.component';
import {PagerAction} from '../../pager/PagerAction';
import {PagerService} from '../../pager/PagerService';
import {Pager} from '../../pager/Pager';
import {IGridColumn} from '../IGridColumn';
import {Eq, ExprDesc, Like, Value, ValueDesc} from '@allgemein/expressions';
import {IDTGridOptions} from '../IDTGridOptions';


@Component({
  selector: 'txs-simple-html-table',
  templateUrl: 'simple-html-table.component.html',
  styleUrls: ['./simple-html-table.component.scss']
})
export class SimpleHtmlTableComponent extends AbstractGridComponent implements OnInit, OnDestroy {

  pager: Pager;

  filterOpened: string = null;

  filterValue: any = null;

  constructor(private pagerService: PagerService) {
    super();
  }

  ngOnInit(): void {
    if (!this.options) {
      this.options = {enablePager: true, limit: 25};
    }
    defaults(this.options, <IDTGridOptions>{enablePager: true});

    if (this.options.enablePager) {
      this.pager = this.pagerService.get(this.options.pagerId);
    }

    if (isEmpty(this._params)) {
      // if params not set set default values
      this._params.limit = this.options.limit;
      this._params.offset = 0;
    }

    if (!this.maxRows && this.rows) {
      // if maxRows is empty and rows already given then derive maxlines
      this.maxRows = this.rows.length;
      if (this.options.enablePager) {
        this.calcPager();
      }
    }
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
          value = parseInt(this.filterValue, 0);
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


  updateRows(action: PagerAction) {
    if (action.name === this.options.pagerId && action.type === 'set') {
      this.params.offset = (action.page - 1) * this.options.limit;
      this.params.limit = this.options.limit;
      this.paramsChange.emit(this.params);
      this.doQuery.emit(this);
    }
  }


  calcPager() {
    if (this.params && isNumber(this.maxRows) && isNumber(this.params.limit)) {
      if (!this.params.offset) {
        this.params.offset = 0;
        this.paramsChange.emit(this._params);
      }
      this.pager.totalPages = Math.ceil(this.maxRows * 1.0 / this.params.limit * 1.0);

      if (!this.pager.checkQueryParam()) {
        this.pager.currentPage = (this.params.offset / this.options.limit) + 1;
        this.pager.calculatePages();
      }
    }
  }


  rebuild() {
    this.calcPager();
    this.gridReady.emit();
  }

  reset() {
    this.pager.reset();
    this.params.offset = 0;
  }


  ngOnDestroy(): void {
    if (this.pager) {
      this.pager.free();
    }

  }


}
