import {AnnotationsHelper} from '@allgemein/schema-api';

export function Hidden() {
  return function (object: any, property: string) {
    AnnotationsHelper.forPropertyOn(object.constructor, property, {form: 'hidden'});
  };
}
