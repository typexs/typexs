import { AnnotationsHelper } from '@allgemein/schema-api';
import { K_FORM, K_TEXT } from '../lib/Constants';

export function Text() {
  return function(object: any, property: string) {
    // use enum attribute, but later it will be deprecated
    AnnotationsHelper.forPropertyOn(object.constructor, property, {
      [K_FORM]: K_TEXT
    });
  };
}
