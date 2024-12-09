import { has, isFunction, isString } from '@typexs/generic';


export class WebServerUtils {

  static checkIfFrameworkIsSet(options: any) {
    return has(options, 'framework') && (isString(options.framework) || isFunction(options.framework));
  }
}
