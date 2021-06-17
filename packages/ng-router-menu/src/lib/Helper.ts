import {
  defaults, find, isArray, isEmpty, isFunction, isNumber, intersection,
  get, clone, upperFirst, isNull, keys, values, isString, filter, merge, isPlainObject,
  concat, kebabCase, has, snakeCase, isRegExp, orderBy, remove, first, set, assign,
  capitalize
} from 'lodash';
import {Route} from '@angular/router';


export function isLazyLoading(route: Route) {
  return has(route, 'loadChildren') || has(route, '_loadedConfig');
}

export function isRedirect(route: Route) {
  return has(route, 'redirectTo');
}

export function hasComponent(route: Route) {
  return has(route, 'component');
}
