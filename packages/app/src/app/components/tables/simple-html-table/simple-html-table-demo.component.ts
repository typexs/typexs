import { assign, keys, range } from 'lodash';
import { ChangeDetectorRef, Component, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { DatatableComponent, IDatatableOptions, IGridApi, IGridColumn, SimpleHtmlTableComponent } from 'packages/base-ng/src';
import { And, ExprDesc } from '@allgemein/expressions';
import { GRID_MODES, K_PAGED } from 'packages/base-ng/src/datatable/Constants';
import { IGridEvent } from 'packages/base-ng/src/datatable/IGridEvent';
import { BehaviorSubject, Observable } from 'rxjs';


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

  @ViewChild(SimpleHtmlTableComponent)
  simpleTable: SimpleHtmlTableComponent;

  simpleTableComp = SimpleHtmlTableComponent;

  api: IGridApi;

  maxRows: number = 0;


  capturedEvent: IGridEvent = null;

  options: IDatatableOptions = {
    mode: K_PAGED,
    pagerId: 'page',
    limit: 10,
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


  rows: any[];

  constructor(private changeDet: ChangeDetectorRef) {
  }


  ngOnInit() {
    this.maxRows = 20;
    this.rows = generateData(1, this.maxRows);
  }

  getGridModes() {
    return GRID_MODES;
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log(changes);
  }

  rebuild() {
    this.datatable?.rebuild();
    this.simpleTable?.rebuild();
  }


  reset() {
    this.datatable?.reset();
    this.simpleTable?.reset();
  }


  generateRows(v: string) {
    if (/\d+/.test(v + '')) {
      const p = parseInt(v, 10);
      if (this.maxRows === p) {
        return;
      }
      // const rows = range(1, p + 1)
      //   .map(x => ({ id: x, name: 'Text ' + x }));
      const rows = generateData(1, p);
      this.rows = rows;
    }
  }

  update(key: string, v: any): void {
    if (key === 'maxRows') {
      this.generateRows(v);
    } else if (key === 'limit') {
      if (/\d+/.test(v)) {
        const limit = parseInt(v, 10);
        this.options = assign(this.options, { limit: limit });
        // this.options.limit = parseInt(v, 10);
        // this.changeDet.detectChanges();
        // this.datatable.componentRef.changeDetectorRef.detectChanges();
      }
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
  }

  onOptionsUpdate($event: IDatatableOptions) {
    console.log($event);
    this.options = assign(this.options, $event);
    if ((this.options as any).maxRows) {
      this.generateRows((this.options as any).maxRows + '');
    }

    this.rebuild();
  }
}
