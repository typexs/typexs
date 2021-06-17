import {assign, has, isArray, remove} from 'lodash';

export class ErrorHelper {

  static detectErrors(data: any) {
    if (isArray(data)) {
      const erroredData = remove(data, x => this.isError(x));
      const errors = [];
      for (let i = 0; i < erroredData.length; i++) {
        const entry = erroredData[i];
        const e = this.detectError(entry);
        if (e) {
          assign(e, {
            index: i,
            nodeId: entry.nodeId,
            instNr: entry.instNr,
          });
          errors.push(e);
        }
      }
      return errors;
    } else {
      const e = this.detectError(data);
      if (e) {
        assign(e, {
          index: null,
          nodeId: data.nodeId,
          instNr: data.instNr,
        });
        return [e];
      } else {
        return [];
      }
    }
  }


  static isError(entry: any) {
    return has(entry, 'error') && has(entry, 'message');
  }


  static detectError(entry: any) {
    if (this.isError(entry)) {
      return new Error(entry.message);
    }
    return null;

  }
}
