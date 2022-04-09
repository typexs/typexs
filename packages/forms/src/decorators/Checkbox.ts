import { ICheckboxOptions } from '../elements/ICheckboxOptions';
import { AnnotationsHelper } from '@allgemein/schema-api';
import { K_CHECKBOX, K_FORM } from '../lib/Constants';

export function Checkbox(opts?: ICheckboxOptions) {
  return function(object: any, property: string) {
    // use enum attribute, but later it will be deprecated
    const _opts: any = { [K_FORM]: K_CHECKBOX };
    if (opts && opts.enum) {
      _opts.enum = opts.enum;
    }
    AnnotationsHelper.forPropertyOn(object.constructor, property, _opts);
  };
}
