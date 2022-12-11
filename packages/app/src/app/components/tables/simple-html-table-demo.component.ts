import { keys, range } from 'lodash';
import { Component } from '@angular/core';
import { IDatatableOptions, IGridApi, IGridColumn, SimpleHtmlTableComponent } from '@typexs/base-ng';
import { And, ExprDesc } from '@allgemein/expressions';
import { K_PAGED } from '@typexs/base-ng/datatable/Constants';
import { IGridEvent } from '@typexs/base-ng/datatable/IGridEvent';


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
  selector: 'simple-html-table-demo',
  templateUrl: 'simple-html-table-demo.component.html'
})
export class SimpleHtmlTableDemoComponent {

  simpleTableComp = SimpleHtmlTableComponent;

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
    console.log('grid event! ' + event.event);
    this.capturedEvent = {
      event: event.event,
      api: null,
      data: event.data
    };
    this.api = event.api;
  }
}
