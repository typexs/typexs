import { deserialize, serialize } from 'v8';
import { assign, cloneDeep, get, isArray, isNumber, isObjectLike, set } from 'lodash';
import { ClassUtils, JsonUtils, TreeUtils } from '@allgemein/base';
import { __CLASS__ } from '../Constants';

export class Serializer {

  static TYPES = {};

  static serialize(data: any) {
    const x = cloneDeep(data);
    this.serializeObject(x);
    return JsonUtils.stringify(x);
  }

  static deserialize(data: any) {
    let x = JsonUtils.parse(data);
    x = this.deserializeObject(x);
    return x;
  }

  static serializeObject(x: any) {
    if (isObjectLike(x) && !isArray(x)) {
      this.serializeClass(x);
      TreeUtils.walk(x, (v) => {
        if (isObjectLike(v.value) && !isArray(v.value)) {
          this.serializeClass(v.value);
        }
      });
    } else if (isArray(x)) {
      for (let i = 0; i < x.length; i++) {
        this.serializeObject(x[i]);
      }
    }
  }

  static deserializeObject(x: any) {
    if (isObjectLike(x) && !isArray(x)) {
      x = this.deserializeClass(x);
      TreeUtils.walk(x, (y) => {
        if (isObjectLike(y.value) && !isArray(y.value)) {
          if (isNumber(y.index)) {
            y.parent[y.index] = this.deserializeClass(y.value);
          } else {
            y.parent[y.key] = this.deserializeClass(y.value);
          }
        }
      });
    } else if (isArray(x)) {
      for (let i = 0; i < x.length; i++) {
        x[i] = this.deserializeObject(x[i]);
      }
    }
    return x;
  }


  static serializeClass(x: any) {
    const clsName = ClassUtils.getClassName(x);
    if (![Object.name, Array.name, Date.name].includes(clsName)) {
      const fn = Object.getPrototypeOf(x);
      if (!this.TYPES[clsName]) {
        this.TYPES[clsName] = fn.constructor;
      }
      set(x, __CLASS__, clsName);
    }
  }

  static deserializeClass(x: any) {
    const clsName = get(x, __CLASS__, null);
    let constructor = null;
    if (this.TYPES[clsName]) {
      constructor = this.TYPES[clsName];
      if (constructor) {
        const y = Reflect.construct(constructor, []);
        assign(y, x);
        delete y[__CLASS__];
        return y;
      }
    }
    return x;
  }

}
