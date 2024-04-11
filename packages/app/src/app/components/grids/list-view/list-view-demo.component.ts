import { keys, range } from 'lodash';
import { Component, OnChanges, SimpleChanges } from '@angular/core';
import { IDatatableOptions, IGridApi, IGridColumn, ListViewComponent, SimpleHtmlTableComponent } from '@typexs/base-ng';
import { And, ExprDesc } from '@allgemein/expressions';
import { IGridEvent } from '@typexs/base-ng/datatable/api/IGridEvent';
import { K_PAGED } from '@typexs/base-ng/datatable/api/IGridMode';


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
export class ListViewDemoComponent  {

  simpleTableComp = ListViewComponent;

  api: IGridApi;

  maxRows: number = 20;

  capturedEvent: IGridEvent = null;

  options: IDatatableOptions = {
    mode: K_PAGED,
    pagerId: 'page',
    limit: 25,
    enablePager: true
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


  rows = generateData(0, 10);

  optionsUpdated($event: any) {
    console.log($event);
  }

  update(key: string, v: any): void {
    if (key === 'maxRows') {
      if (/\d+/.test(v)) {
        const p = parseInt(v, 10);
        const rows = range(1, p + 1).map(x => ({ id: x, name: 'Text ' + x }));
        this.rows = rows;
      }
    }
  }


  doQuery(api: IGridApi): void {
    let generated = generateData(api.params.offset, api.params.limit);

    if (api.params.filters) {
      const _keys = keys(api.params.filters);
      let filter: ExprDesc = null;
      if (_keys.length > 1) {
        filter = And(..._keys.map(x => api.params.filters[x]));
      } else {
        filter = api.params.filters[_keys.shift()];
      }
      const _filter = filter.lookup({});
      generated = generated.filter(v => _filter(v));
    }

    api.setRows(generated);
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
  }
}
