import { Action } from 'routing-controllers';
import { MetaArgs } from '@typexs/base';
import { K_META_PERMISSIONS_ARGS, K_ROUTE_CACHE } from './Constants';
import { concat, isArray, isEmpty, snakeCase } from '@typexs/generic';


export class RoutePermissionsHelper {


  static getPermissionsForAction(action: Action,
                                 paramNorm: (x: string) => string = (x) => !/\*/.test(x + '') ? snakeCase(x + '') : x + ''): string[] {
    const actions = MetaArgs.key(K_ROUTE_CACHE);

    const actionMetadatas = actions.filter(
      x => x.method === action.request.method.toLowerCase() &&
        x.route === action.request.route.path);

    if (!isEmpty(actionMetadatas)) {
      const params = action.request.params;
      let permissions: string[] = [];
      actionMetadatas.map(p => p.permissions && isArray(p.permissions) ? permissions = permissions.concat(p.permissions) : null);
      if (!isEmpty(permissions)) {

        const parameterizePermissions = [];
        for (const right of permissions) {
          const hasMatches = right.match(/:((\w|_)+(\d|\w|_)+)/g);
          if (hasMatches) {
            let rights = [right];
            for (const match of hasMatches) {
              let paramName = match.replace(':', '');

              if (!params[paramName] && params[snakeCase(paramName)]) {
                paramName = snakeCase(paramName);
              }

              if (params[paramName]) {
                if (/,/.test(params[paramName])) {
                  // multiply rights
                  const multipliedRights = params[paramName].split(',').map((x: string) => x.trim()).map((y: string) => {
                    const paramValue = paramNorm(y);
                    return rights.map(z => z.replace(match, paramValue));
                  });
                  rights = concat([], ...multipliedRights);
                } else {
                  const paramValue = paramNorm(params[paramName]);
                  rights = rights.map(z => z.replace(match, paramValue));
                }
              }
            }
            parameterizePermissions.push(...rights);
          } else {
            parameterizePermissions.push(right);
          }
        }
        return parameterizePermissions;
      }
    }
    return [];
  }


  static getPermissionFor(target: Function, methodName: string): any {
    const permissions = MetaArgs.key(K_META_PERMISSIONS_ARGS)
      .find(x => x.target === target &&
        methodName === x.method);
    return permissions;
  }

}
