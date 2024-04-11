import { assign, keys, range } from 'lodash';
import { ChangeDetectorRef, Component, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { DatatableComponent, IDatatableOptions, IGridApi, IGridColumn, SimpleHtmlTableComponent } from '@typexs/base-ng';
import { And, ExprDesc } from '@allgemein/expressions';
import { IGridEvent } from '@typexs/base-ng/datatable/api/IGridEvent';
import { BehaviorSubject, Observable } from 'rxjs';
import { GRID_MODES, IGridMode, K_PAGED } from '@typexs/base-ng/datatable/api/IGridMode';


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
export class SimpleHtmlTableDemoComponent implements OnInit, OnChanges {

  @ViewChild(DatatableComponent)
  datatable: DatatableComponent;


  simpleTableComp = SimpleHtmlTableComponent;

  api: IGridApi;

  maxRows: number = 0;


  capturedEvent: IGridEvent = null;

  options: IDatatableOptions = {
    mode: K_PAGED,
    pagerId: 'page',
    limit: 10,
    enablePager: true,
    maxRows: 200
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

  loadBoundries: any = {};

  frameBoundries: any = {};

  rows: any[];

  constructor(private changeDet: ChangeDetectorRef) {
  }


  ngOnInit() {
    this.maxRows = 20;
    this.rows = generateData(1, this.maxRows);

  }

  ngOnChanges(changes: SimpleChanges) {
    console.log(changes);
  }

  rebuild() {
    this.datatable?.rebuild();
    // this.rows = generateData(1, this.maxRows);
    // this.simpleTable?.rebuild();
  }


  reset() {
    // this.datatable?.reset();
    // this.ngOnInit();
    // this.datatable?.rebuild();
  }


  generateRows(v: string) {
    if (/\d+/.test(v + '')) {
      const p = parseInt(v, 10);
      if (this.maxRows === p) {
        return;
      }
      const rows = generateData(1, p);
      this.rows = rows;
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
    this.viewModes = this.api.supportedModes();
    // this.frameBoundries = this.api.getDataNodes().getFrameBoundries();
    // this.loadBoundries = this.api.getDataNodes().getLoadBoundries();
    // this.api.getDataNodes().getState().subscribe(x => {
    //   this.frameBoundries = this.api.getDataNodes().getFrameBoundries();
    //   this.loadBoundries = this.api.getDataNodes().getLoadBoundries();
    // });

  }

  onOptionsUpdate($event: IDatatableOptions) {
    this.options = assign(this.options, $event);
    if (this.options.maxRows) {
      this.generateRows(this.options.maxRows + '');
      this.maxRows = this.options.maxRows;
    }
    this.rebuild();
  }
}
