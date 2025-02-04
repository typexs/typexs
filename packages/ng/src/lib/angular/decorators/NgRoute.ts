import { isString } from '@typexs/generic';
import { Route } from '@angular/router';
import { MetaArgs } from '@allgemein/base';
import { Type } from '@angular/core';

export const K_NG_ROUTES = 'ng_routes';

export function NgRoute(path: string | Route) {
  return function(object: Function) {
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

