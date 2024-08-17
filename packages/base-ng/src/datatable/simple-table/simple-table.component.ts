import { get, set } from 'lodash';
import { ChangeDetectorRef, Component } from '@angular/core';
import { AbstractGridComponent } from '../api/abstract-grid.component';
import { PagerService } from '../../pager/PagerService';
import { IGridColumn } from '../api/IGridColumn';
import { Eq, ExprDesc, Like, Value, ValueDesc } from '@allgemein/expressions';
import { ISimpleTable } from './ISimpleTable';
import { IGridMode, K_PAGED, K_VIEW } from '../api/IGridMode';


/**
 * TODO:
 *
 * - loading when data is fetched
 */

@Component({
  selector: 'txs-simple-table',
  templateUrl: 'simple-table.component.html',
  styleUrls: ['./simple-table.component.scss']
})
export class SimpleTableComponent extends AbstractGridComponent implements ISimpleTable {

  filterOpened: string = null;

  filterValue: any = null;



  constructor(
    private pagerService: PagerService,
    private changeRef: ChangeDetectorRef
  ) {
    super(pagerService, changeRef);
  }

  getSelf(): ISimpleTable {
    return this;
  }


  supportedViewModes(): IGridMode[] {
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

    if (this.options.mode) {
      switch (this.options.mode) {
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


  private onPagedMode() {
    this.options.enablePager = true;
  }


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


}
