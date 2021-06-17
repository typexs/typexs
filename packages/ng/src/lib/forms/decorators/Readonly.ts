import {AnnotationsHelper} from '@allgemein/schema-api';

export function Readonly() {
  return function (object: any, property: string) {
    AnnotationsHelper.forPropertyOn(object.constructor, property, {form: 'readonly'});
  };
}
