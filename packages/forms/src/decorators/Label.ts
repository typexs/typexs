import { AnnotationsHelper } from '@allgemein/schema-api';
import { C_ENTITY_LABEL, K_FORM, K_LABEL } from '../lib/Constants';
import { ILabelOptions } from '../elements/ILabelOptions';
import { defaults } from 'lodash';

export function Label(options?: ILabelOptions) {
  return function(object: any, property: string) {
    // use enum attribute, but later it will be deprecated
    options = defaults(options || {}, { [C_ENTITY_LABEL]: true });
    AnnotationsHelper.forPropertyOn(object.constructor, property, {
      [K_FORM]: K_LABEL,
      ...options
    });
  };
}
