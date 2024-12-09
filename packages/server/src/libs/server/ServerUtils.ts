import { has, isFunction, isNull, isString, isUndefined } from '@typexs/generic';


import { DEFAULT_ANONYMOUS } from '../Constants';


export class ServerUtils {

  static checkIfTypeIsSet(options: any) {
    return has(options, 'type') && (isString(options.type) || isFunction(options.type));
  }

  static isAnonymous(user: any) {
    return !user || (isString(user) && user === DEFAULT_ANONYMOUS);
  }

  static hasPermissionCheck(user: any) {
    return !ServerUtils.isAnonymous(user) || isNull(user) || isUndefined(user);
  }

}
