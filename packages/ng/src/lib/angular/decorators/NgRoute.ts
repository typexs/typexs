import {
  defaults, find, isArray, isEmpty, isFunction, isNumber, intersection,
  get, clone, upperFirst, isNull, keys, values, isString, filter, merge, isPlainObject,
  concat, kebabCase, has, snakeCase, isRegExp, orderBy, remove, first, set, assign,
  capitalize, isUndefined, isDate, last, uniq
} from 'lodash';
import {Route} from '@angular/router';
import {Type} from '@angular/core/core';
import {MetaArgs} from '@allgemein/base';

export const K_NG_ROUTES = 'ng_routes';

export function NgRoute(path: string | Route) {
  return function (object: Function) {
    let r: Route = {};
    if (isString(path)) {
      r.path = <string>path;
    } else {
      r = <Route>path;
    }
    r.component = <Type<any>>object;
    MetaArgs.key(K_NG_ROUTES).push(r);
  };
}

