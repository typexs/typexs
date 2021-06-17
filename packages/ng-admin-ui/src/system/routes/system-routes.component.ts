import {
  defaults, find, isArray, isEmpty, isFunction, isNumber, intersection,
  get, clone, upperFirst, isNull, keys, values, isString, filter, merge, isPlainObject,
  concat, kebabCase, has, snakeCase, isRegExp, orderBy, remove, first, set, assign,
  capitalize, isUndefined
} from 'lodash';
import {Component, OnInit} from '@angular/core';
import {IRoute} from '@typexs/server/libs/server/IRoute';

import {SystemInfoService} from '@typexs/base-ng';


const API_CTRL_URL = '/api/routes';

@Component({
  selector: 'system-routes',
  templateUrl: './system-routes.component.html'
})
export class SystemRoutesComponent implements OnInit {

  routes: IRoute[] = [];


  constructor(private infoService: SystemInfoService) {
  }

  objectKeys(obj: any) {
    return keys(obj);
  }

  ngOnInit() {
    this.infoService.loadRoutes((err: Error, x: IRoute[]) => {
      if (x) {
        this.routes = x;
      }
    });
  }
}
