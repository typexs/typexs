import {find} from 'lodash';
import {IResolver} from '../lib/IResolver';
import {FormObject} from '../lib/FormObject';
import {ResolveDataValue} from '../lib/ResolveDataValue';
import {Ref} from './Ref';
import {ViewContent} from '@typexs/base/libs/bindings/decorators/ViewContent';


@ViewContent('form')
export class Form extends FormObject {

  dataContainer: any;

  resolver: IResolver[] = [];

  combine(otherForm: Form) {
    const resolverCache: IResolver[] = [];

    while (this.resolver.length > 0) {
      const resolver = this.resolver.shift();
      if (resolver instanceof ResolveDataValue) {
        resolver.resolve(otherForm);
      } else {
        resolverCache.push(resolver);
      }
    }

    while (resolverCache.length > 0) {

      const resolver = resolverCache.shift();
      if (resolver instanceof Ref) {
        resolver.resolve(otherForm);
      }
    }

    return this;
  }

  get(path: string) {
    const _path = path.split('.');
    let tmpElem: FormObject = this;
    let element = null;
    while (_path.length > 0) {
      const _p = _path.shift();
      const ret = find(<FormObject[]>tmpElem.getChildren(), {name: _p});
      // if(isFormObject(ret)){
      tmpElem = ret;
      if (!tmpElem) {
        break;
      } else {
        element = tmpElem;
      }
      // }
    }
    return _path.length === 0 && element ? element : null;

  }


}
