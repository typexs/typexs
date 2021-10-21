import {
  defaults, find, isArray, isEmpty, isFunction, isNumber, intersection,
  get, clone, upperFirst, isNull, keys, values, isString, filter, merge, isPlainObject,
  concat, kebabCase, has, snakeCase, isRegExp, orderBy, remove, first, set, assign,
  capitalize, isUndefined, isDate, range
} from 'lodash';
import {Component} from '@angular/core';
import {IGridColumn} from '@typexs/base-ng';
import {SimpleHtmlTableComponent} from '@typexs/base-ng';
import {IDTGridOptions} from '@typexs/base-ng';
import {IGridApi} from '@typexs/base-ng';
import {And, ExprDesc} from '@allgemein/expressions';


@Component({
  selector: 'simple-html-table-demo',
  templateUrl: 'simple-html-table-demo.component.html',
})
export class SimpleHtmlTableDemoComponent {

  simpleTableComp = SimpleHtmlTableComponent;


  maxRows: number;


  options: IDTGridOptions = {
    pagerId: 'page',
    limit: 25,
    enablePager: true
  };

  columns: IGridColumn[] = [
    {label: 'Id', field: 'id', filter: true, sorting: true, filterDataType: 'number'},
    {label: 'Name', field: 'name'},
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
