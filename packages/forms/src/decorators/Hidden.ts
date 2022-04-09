import { AnnotationsHelper } from '@allgemein/schema-api';
import { K_FORM, K_HIDDEN } from '../lib/Constants';

export function Hidden() {
  return function(object: any, property: string) {
    AnnotationsHelper.forPropertyOn(object.constructor, property, {
      [K_FORM]: K_HIDDEN
    });
  };
}
