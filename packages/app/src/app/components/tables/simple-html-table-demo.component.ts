import {
  defaults, find, isArray, isEmpty, isFunction, isNumber, intersection,
  get, clone, upperFirst, isNull, keys, values, isString, filter, merge, isPlainObject,
  concat, kebabCase, has, snakeCase, isRegExp, orderBy, remove, first, set, assign,
  capitalize, isUndefined, isDate, range
} from 'lodash';
import { Component } from '@angular/core';
import { IGridColumn } from 'packages/base-ng/src';
import { SimpleHtmlTableComponent } from 'packages/base-ng/src';
import { IDatatableOptions } from 'packages/base-ng/src';
import { IGridApi } from 'packages/base-ng/src';
import { And, ExprDesc } from '@allgemein/expressions';
import { K_PAGED } from '@typexs/base-ng/datatable/Constants';


@Component({
  selector: 'simple-html-table-demo',
  templateUrl: 'simple-html-table-demo.component.html'
})
export class SimpleHtmlTableDemoComponent {

  simpleTableComp = SimpleHtmlTableComponent;


  maxRows: number;


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


  rows = [
    {
      id: 1,
      name: 'First'
    },
    {
      id: 2,
      name: 'Second'
    }
  ];


  update(key: string, v: any): void {
    if (key === 'maxRows') {
      if (/\d+/.test(v)) {
        const p = parseInt(v, 10);
        const rows = range(1, p + 1).map(x => ({ id: x, name: 'Text ' + x }));
        this.rows = rows;
      }
    }
  }

  generateData(offset: number, limit: number) {
    return range(offset, offset + limit).map(x => {
      return {
        id: x,
        name: 'Entry ' + x
      };
    });
  }

  doQuery(api: IGridApi): void {
    let generated = this.generateData(api.params.offset, api.params.limit);

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
}
