import { isArray, isEmpty, isFunction, isUndefined } from 'lodash';
import { IAPIDef } from '../libs/api/IAPIDef';
import { ClassType } from '@allgemein/schema-api';
import { Injector } from '../libs/di/Injector';
import { isPromiseLike } from '@allgemein/base';


export class Invoker {

  static NAME: string = Invoker.name;


  private apiImpls: IAPIDef[] = [];


  register(api: Function, impl: Function | Function[]) {
    let def = this.apiImpls.find(x => x.api === api);
    if (!def) {
      const invoker = this;
      const obj = {};
      const proto = Object.getOwnPropertyNames(api.prototype);
      proto.forEach(p => {
        if (p === 'constructor') {
          return;
        }
        const desc = Object.getOwnPropertyDescriptor(api.prototype, p);
        if (isFunction(desc.value)) {
          obj[p] = function(...args: any[]) {
            return invoker.execute(api, p, ...args);
          };
        }
      });
      def = { api: api, impl: [], handle: obj };
      this.apiImpls.push(def);
    }
    if (isArray(impl)) {
      impl.forEach(i => {
        if (def.impl.indexOf(i) === -1) {
          def.impl.push(i);
        }
      });
    } else {
      if (def.impl.indexOf(impl) === -1) {
        def.impl.push(impl);
      }
    }
  }


  private execute(api: Function, method: string, ...args: any[]) {
    const def = this.apiImpls.find(apiImpl => apiImpl.api === api);
    const instances = def.impl.map(impl => Injector.get(impl));
    const results = [];
    let isPromised = false;
    for (const instance of instances) {
      if (!isUndefined(instance[method]) && isFunction(instance[method])) {
        const ret = instance[method].apply(instance, args);
        isPromised = isPromised || isPromiseLike(ret);
        results.push(ret);
      }
    }
    if (isPromised && results.length > 0) {
      return Promise.all(results);
    }
    return results;
  }


  has(api: Function) {
    const c = this.apiImpls.find(apiImpl => apiImpl.api === api);
    return !!c;
  }


  hasImpl(api: Function) {
    const c = this.apiImpls.find(apiImpl => apiImpl.api === api);
    return !isEmpty(c.impl);
  }


  use<API>(api: ClassType<API>): API {
    const def = this.apiImpls.find(apiImpl => apiImpl.api === api);
    if (!def) {
      throw new Error('no api implementation found');
    }
    return <API>def.handle;
  }

}
