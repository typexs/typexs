import { assign, range } from 'lodash';
import { ChangeDetectorRef, Component, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { DatatableComponent, IDatatableOptions, IGridApi, IGridColumn, SimpleTableComponent } from '@typexs/base-ng';
import { IGridEvent } from '@typexs/base-ng/datatable/api/IGridEvent';
import { IGridMode, K_PAGED } from '@typexs/base-ng/datatable/api/IGridMode';
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
  selector: 'simple-html-table-demo',
  templateUrl: 'simple-table-demo.component.html'
})
export class SimpleTableDemoComponent {

  @ViewChild(DatatableComponent)
  datatableComp: DatatableComponent;

  comp = SimpleTableComponent;

  api: IGridApi;

  maxRows: number = 200;

  capturedEvent: IGridEvent = null;

  options: IDatatableOptions = {
    mode: K_PAGED,
    pagerId: 'page',
    limit: 10,
    enablePager: true,
    queryCallback: this.queryCallback.bind(this)
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

  viewModes: IGridMode[] = [];

  rows: any[];


  // ngOnInit() {
  //   this.maxRows = 20;
  //   // this.rows = generateData(1, this.maxRows);
  //
  // }
  //
  // ngOnChanges(changes: SimpleChanges) {
  //   console.log(changes);
  // }

  queryCallback(start: number, end: number, limit: number) {
    // return of(range(start, end + 1).map(x => ({ id: x, name: 'Text ' + x })));
    return of(generateData(start, end, limit));
  }

  // rebuild() {
  //   this.datatable?.rebuild();
  //   // this.rows = generateData(1, this.maxRows);
  //   // this.simpleTable?.rebuild();
  // }
  //
  //
  // reset() {
  //   // this.datatable?.reset();
  //   // this.ngOnInit();
  //   // this.datatable?.rebuild();
  // }


  // generateRows(v: string) {
  //   if (/\d+/.test(v + '')) {
  //     const p = parseInt(v, 10);
  //     if (this.maxRows === p) {
  //       return;
  //     }
  //     const rows = generateData(1, p);
  //     this.rows = rows;
  //   }
  // }

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
  //
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

  onOptionsUpdate($event: any) {
    // this.options = assign(this.options, $event);
    // if (this.options.maxRows) {
    //   this.generateRows(this.options.maxRows + '');
    //   this.maxRows = this.options.maxRows;
    // }
    // // this.rebuild();
    if ($event._update && $event._update.key === 'mode') {
      // console.log('change mode');
      this.datatableComp.setViewMode($event._update.value);
    } else if ($event._update && $event._update.key === 'limit') {
      this.datatableComp.limit = $event._update.value;
    }

  }
}
