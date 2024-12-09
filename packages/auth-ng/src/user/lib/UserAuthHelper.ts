import { get, isArray, isBoolean, isNull } from '@typexs/generic';


import { ActivatedRouteSnapshot, Route } from '@angular/router';
import { K_ANONYM_VIEW, K_IS_AUTHENTICATED, K_PERMISSIONS } from './Constants';

export class UserAuthHelper {


  static getRoutePermissions(route: ActivatedRouteSnapshot | Route, replaceParams: boolean = true) {
    let perms = get(route, 'data.' + K_PERMISSIONS, null);
    if (perms && isArray(perms) && replaceParams && route instanceof ActivatedRouteSnapshot) {
      perms = perms.map((x: string) => {
        let y = x;
        route.paramMap.keys.forEach(k => {
          y = y.replace(':' + k + ' ', route.paramMap.get(k) + ' ');
        });
        return y;
      });

    }
    return perms;
  }


  static getRouteAuthenticationCheck(route: ActivatedRouteSnapshot | Route) {
    return get(route, 'data.' + K_IS_AUTHENTICATED, null);
  }

  static getRouteDisallowViewMode(route: ActivatedRouteSnapshot | Route): 'hide' | 'disable' {
    return get(route, 'data.' + K_ANONYM_VIEW, 'hide');
  }

  /**
   * Return true if authentication is necessary for the route access or false if show only when user is not authenticated.
   * @param route
   */
  static checkIfAuthRequired(route: ActivatedRouteSnapshot | Route) {
    const hasAuth = this.getRouteAuthenticationCheck(route);
    if (isBoolean(hasAuth)) {
      return hasAuth;
    }

    const hasPermis = this.getRoutePermissions(route);
    if (!isNull(hasPermis)) {
      return true;
    }
    return null;
  }

  static hasRouteAuthCheck(route: ActivatedRouteSnapshot | Route) {
    const hasAuth = this.getRouteAuthenticationCheck(route);
    if (!isNull(hasAuth)) {
      return true;
    }
    const hasPermissions = this.getRoutePermissions(route);
    if (!isNull(hasPermissions)) {
      return true;
    }
    return false;

  }

}
