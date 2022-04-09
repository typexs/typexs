import { AnnotationsHelper } from '@allgemein/schema-api';
import { K_FORM, K_RADIO } from '../lib/Constants';

export function Radio() {
  return function(object: any, property: string) {
    // use enum attribute, but later it will be deprecated
    AnnotationsHelper.forPropertyOn(object.constructor, property, {
      [K_FORM]: K_RADIO
    });
  };
}
