import * as _ from 'lodash';


export class ProcessingHelper {
  static isPromise(obj: any) {
    if (_.isObject(obj) && obj['then'] && _.isFunction(obj['then'])) {
      return true;
    }
    return false;
  }


}
