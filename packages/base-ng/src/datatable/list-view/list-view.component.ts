import { get, set } from 'lodash';
import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { AbstractGridComponent } from '../api/abstract-grid.component';
import { PagerService } from '../../pager/PagerService';
import { IGridColumn } from '../api/IGridColumn';
import { Eq, ExprDesc, Like, Value, ValueDesc } from '@allgemein/expressions';
import { IDatatableListGridOptions } from './IDatatableListGridOptions';
import { IGridMode, K_INFINITE, K_PAGED, K_VIEW } from '../api/IGridMode';
import { Log } from '../../lib/log/Log';


@Component({
  selector: 'txs-list-view',
  templateUrl: 'list-view.component.html',
  styleUrls: ['./list-view.component.scss']
})
export class ListViewComponent extends AbstractGridComponent {


  filterOpened: string = null;

  filterValue: any = null;

  @Input()
  allowViewModeSwitch: boolean = true;

  @Input()
  viewMode: string = 'teaser';

  @Input()
  options: IDatatableListGridOptions;

  constructor(
    public pagerService: PagerService,
    public changeRef: ChangeDetectorRef
  ) {
    super(pagerService, changeRef);
  }

  supportedModes(): IGridMode[] {
    return [
      { name: K_VIEW, label: K_VIEW },
      { name: K_PAGED, label: K_PAGED },
      { name: K_INFINITE, label: K_INFINITE }
    ];
  }


  onBottomReached($event: any){
    Log.info('asd');
  }

  // isSorted(column: IGridColumn, sort: 'asc' | 'desc' | 'none') {
  //   if (!column.sorting) {
  //     return false;
  //   }
  //
  //   const _sort = get(this.params.sorting, column.field);
  //   if (!_sort && sort === 'none') {
  //     return true;
  //   } else if (_sort === sort) {
  //     return true;
  //   }
  //   return false;
  // }
  //
  //
  // doSort(column: IGridColumn) {
  //   if (!this.params.sorting) {
  //     this.params.sorting = {};
  //   }
  //   const _sort = get(this.params.sorting, column.field);
  //   if (_sort) {
  //     if (_sort === 'asc') {
  //       set(this.params.sorting, column.field, 'desc');
  //     } else {
  //       delete this.params.sorting[column.field];
  //     }
  //   } else {
  //     set(this.params.sorting, column.field, 'asc');
  //   }
  //   this.paramsChange.emit(this.params);
  //   this.doQuery.emit(this);
  // }
  //
  //
  // openFilter(column: IGridColumn) {
  //   this.filterOpened = column.field;
  //   const filter: ExprDesc = get(this.params.filters, column.field);
  //   if (filter) {
  //     this.filterValue = filter.value instanceof ValueDesc ? filter.value.value : filter.value;
  //   } else {
  //     this.filterValue = null;
  //   }
  // }
  //
  //
  // closeFilter(column: IGridColumn) {
  //   if (!this.params.filters) {
  //     this.params.filters = {};
  //   }
  //   if (this.filterValue) {
  //
  //     let value: any = null;
  //     switch (column.filterDataType) {
  //       case 'date':
  //         value = new Date(this.filterValue);
  //         break;
  //       case 'double':
  //         value = parseFloat(this.filterValue);
  //         break;
  //       case 'number':
  //         value = parseInt(this.filterValue, 10);
  //         break;
  //       default:
  //         value = this.filterValue;
  //     }
  //
  //     switch (column.filterType) {
  //       case 'contains':
  //         set(this.params.filters, column.field, Like(column.field, Value(value)));
  //         break;
  //       case 'suggest':
  //       case 'equal':
  //       default:
  //         set(this.params.filters, column.field, Eq(column.field, Value(value)));
  //         break;
  //     }
  //   } else {
  //     delete this.params.filters[column.field];
  //   }
  //   this.paramsChange.emit(this.params);
  //   this.filterOpened = null;
  //   this.doQuery.emit(this);
  // }


  // protected readonly K_INFINITE = K_INFINITE;
}
