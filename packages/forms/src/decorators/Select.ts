import { AnnotationsHelper } from '@allgemein/schema-api';
import { ISelectOptions } from '../elements/ISelectOptions';
import { K_FORM, K_SELECT } from '../lib/Constants';

export function Select(options: ISelectOptions) {
  return function(object: any, property: string) {
    // use enum attribute, but later it will be deprecated
    AnnotationsHelper.forPropertyOn(object.constructor, property, {
      [K_FORM]: K_SELECT,
      [K_SELECT]: options,
      enum: options.enum
    });
  };
}
