import {
  defaults, find, isArray, isEmpty, isFunction, isNumber, intersection,
  get, clone, upperFirst, isNull, keys, values, isString, filter, merge, isPlainObject,
  concat, kebabCase, has, snakeCase, isRegExp, orderBy, remove, first
} from 'lodash';

export type ALIGNMENT = 'vertical' | 'horizontal';

export type LABEL_DISPLAY = 'top' | 'inline' | 'none';

export class Context {

  name: string;

  idx: number = -1;

  parent: Context;

  labelDisplay: LABEL_DISPLAY;

  // alignment:

  child(_name: string = null, idx: number = -1) {
    const name = new Context();
    name.parent = this;
    name.name = _name;
    name.idx = idx;
    return name;
  }


  path(): string {
    let arr: string[] = [];
    if (this.parent) {
      arr = this.parent.path().split('.');
    }

    if (this.idx > -1) {
      arr[arr.length - 1] = arr[arr.length - 1] + '.' + this.idx + '';
    } else {
      arr.push(this.name);
    }
    return filter(arr, (x: string) => !isEmpty(x)).join('.');
  }


  get(key: string, _default: any = null): any {
    if (has(this, key)) {
      return get(this, key, _default);
    } else if (this.parent) {
      return this.parent.get(key);
    }
    return _default;
  }

}
