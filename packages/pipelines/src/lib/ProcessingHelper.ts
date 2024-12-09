import { isFunction, isObject } from '@typexs/generic';


export class ProcessingHelper {
  static isPromise(obj: any) {
    if (isObject(obj) && obj['then'] && isFunction(obj['then'])) {
      return true;
    }
    return false;
  }


}
