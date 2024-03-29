import { assign, defaults, get, isEmpty, isNumber, set } from 'lodash';
import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { AbstractGridComponent } from '../abstract-grid.component';
import { PagerAction } from '../../pager/PagerAction';
import { PagerService } from '../../pager/PagerService';
import { Pager } from '../../pager/Pager';
import { IGridColumn } from '../IGridColumn';
import { Eq, ExprDesc, Like, Value, ValueDesc } from '@allgemein/expressions';
import { IDatatableOptions } from '../IDatatableOptions';
import { K_PAGED } from '../Constants';
import { ISimpleTable } from './ISimpleTable';
import { DOCUMENT } from '@angular/common';


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

  constructor(
    private pagerService: PagerService,
    private changeRef: ChangeDetectorRef,
    @Inject(DOCUMENT) private document: Document) {
    super(pagerService, changeRef);
  }

  getSelf(): ISimpleTable {
    return this;
  }


  addNewRow() {
    // TODO
  }

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
    this.pager.reset();
    this.params.offset = 0;
  }


  ngOnDestroy(): void {
    if (this.pager) {
      this.pager.free();
    }

  }


}
