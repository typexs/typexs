import { keys, range } from 'lodash';
import { Component, ViewChild } from '@angular/core';
import {
  DatatableComponent,
  IDatatableListGridOptions,
  IDatatableOptions,
  IGridApi,
  IGridColumn,
  ListViewComponent
} from '@typexs/base-ng';
import { And, ExprDesc } from '@allgemein/expressions';
import { IGridEvent } from '@typexs/base-ng/datatable/api/IGridEvent';
import { IGridMode, K_INFINITE } from '@typexs/base-ng/datatable/api/IGridMode';
import { of } from 'rxjs';


function generateData(offset: number, limit: number) {
  return range(offset, offset + limit).map(x => ({
    id: x,
    name: 'Entry ' + x
  }));
}

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

  simpleTableComp = ListViewComponent;

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
    queryCallback: (start, end, limit) => {
      return of(range(start, end + 1).map(x => ({ id: x, name: 'Text ' + x })));
    },
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

  optionsUpdated($event: any) {
    console.log($event);
    // this.options = $event;
    if ($event._update && $event._update.key === 'mode') {
      console.log('change mode');
      this.datatableComp.setViewMode($event._update.value);
    } else if ($event._update && $event._update.key === 'limit') {
      this.datatableComp.limit = $event._update.value;
    }
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


  // doQuery(api: IGridApi): void {
  //   let generated = generateData(api.params.offset, api.params.limit);
  //
  //   if (api.params.filters) {
  //     const _keys = keys(api.params.filters);
  //     let filter: ExprDesc = null;
  //     if (_keys.length > 1) {
  //       filter = And(..._keys.map(x => api.params.filters[x]));
  //     } else {
  //       filter = api.params.filters[_keys.shift()];
  //     }
  //     const _filter = filter.lookup({});
  //     generated = generated.filter(v => _filter(v));
  //   }
  //   api.setRows(generated);
  // }

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
