import { MetaArgs } from '@typexs/base';
import { Authorized } from 'routing-controllers';
import { K_META_PERMISSIONS_ARGS } from '../libs/Constants';
import { isArray } from '@typexs/generic';


export function Access(permissions?: string | string[] | Function): Function {
  return function(clsOrObject: Function | Object, method?: string) {
    MetaArgs.key(K_META_PERMISSIONS_ARGS).push({
      target: method ? clsOrObject.constructor : clsOrObject as Function,
      method: method,
      accessPermissions: isArray(permissions) ? permissions : [permissions]
    });
    /* if permissions are necassery then also authorization */
    Authorized()(clsOrObject, method);
  };
}
