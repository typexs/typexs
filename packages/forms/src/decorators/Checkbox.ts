import {ICheckboxOptions} from '../elements/ICheckboxOptions';
import {AnnotationsHelper} from '@allgemein/schema-api';

export function Checkbox(opts?: ICheckboxOptions) {
  return function (object: any, property: string) {
    // use enum attribute, but later it will be deprecated
    const _opts: any = {form: 'checkbox'};
    if (opts && opts.enum) {
      _opts.enum = opts.enum;
    }
    AnnotationsHelper.forPropertyOn(object.constructor, property, _opts);
  };
}
