import { range } from 'lodash';
import { Component, ViewChild } from '@angular/core';
import { DatatableComponent, IDatatableListGridOptions, IGridApi, IGridColumn, ListViewComponent } from '@typexs/base-ng';
import { IGridEvent } from '@typexs/base-ng/datatable/api/IGridEvent';
import { IGridMode, K_INFINITE } from '@typexs/base-ng/datatable/api/IGridMode';
import { of } from 'rxjs';
import { generateData } from '../functions';

/**
 * Test of simple-html-table layout
 *
 * - test pager
 *
 * - modification
 *   - create
 *   - read
 *   - update
 *   - delete
 *
 *
 */
@Component({
  selector: 'list-view-demo',
  templateUrl: 'list-view-demo.component.html'
})
export class ListViewDemoComponent {

  @ViewChild(DatatableComponent)
  datatableComp: DatatableComponent;

  comp = ListViewComponent;

  api: IGridApi;

  /**
   * Set undefined for unknown end of infinite scroll
   */
  maxRows: number = undefined;

  capturedEvent: IGridEvent = null;

  options: IDatatableListGridOptions = {
    // mode: K_PAGED,
    mode: K_INFINITE,
    pagerId: 'page',
    limit: 25,
    enablePager: true,
    queryCallback: this.queryCallback.bind(this),
    infiniteMode: 'overflow'
  };

  columns: IGridColumn[] = [
    {
      label: 'Id',
      field: 'id',
      filter: true,
      sorting: true,
      filterDataType: 'number'
    },
    {
      label: 'Name',
      field: 'name'
    }
  ];


  rows: any[] = undefined;

  viewModes: IGridMode[];

  onOptionsUpdate($event: any) {
    // console.log($event);
    // this.options = $event;
    if ($event._update && $event._update.key === 'mode') {
      // console.log('change mode');
      this.datatableComp.setViewMode($event._update.value);
    } else if ($event._update && $event._update.key === 'limit') {
      this.datatableComp.limit = $event._update.value;
    }
  }

  queryCallback(start: number, end: number, limit: number) {
    // return of(range(start, end + 1).map(x => ({ id: x, name: 'Text ' + x })));
    return of(generateData(start, end, limit));
  }

  update(key: string, v: any): void {
    if (key === 'maxRows') {
      if (/\d+/.test(v)) {
        const p = parseInt(v, 10);
        const rows = range(1, p + 1).map(x => ({ id: x, name: 'Text ' + x }));
        this.rows = rows;
      }
    } else if (key === 'infinite-mode') {
      this.options.infiniteMode = v;
    }
  }

  /**
   *  Capture send event
   *
   * @param event
   */
  onGridReady(event: IGridEvent) {
    this.capturedEvent = {
      event: event.event,
      api: null,
      data: event.data
    };
    this.api = event.api;
    this.viewModes = this.api.supportedViewModes();
  }

  getInfiniteMode() {
    return [{ name: 'simple' }, { name: 'overflow' }];
  }
}
