import { AnnotationsHelper } from '@allgemein/schema-api';
import { K_FORM, K_READONLY } from '../lib/Constants';

export function Readonly() {
  return function(object: any, property: string) {
    AnnotationsHelper.forPropertyOn(object.constructor, property, {
      [K_FORM]: K_READONLY
    });
  };
}
