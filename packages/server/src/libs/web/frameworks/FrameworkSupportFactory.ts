import { Injector, StringOrFunction } from '@typexs/base';
import { IFrameworkSupport } from './IFrameworkSupport';
import { ExpressSupport } from './express/ExpressSupport';
import { isString } from '@typexs/generic';


export class FrameworkSupportFactory {


  static get(name: StringOrFunction): IFrameworkSupport {
    if (isString(name)) {
      switch (name) {
        case 'express':
          return Injector.get(ExpressSupport);
        default:
          throw new Error('server type');
      }
    } else {
      return Reflect.construct(name, []);
    }
  }

}
