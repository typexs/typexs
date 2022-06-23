import { AnnotationsHelper } from '@allgemein/schema-api';
import { K_FORM, K_TEXT } from '../lib/Constants';
import { ITextOptions } from '../elements/ITextOptions';

export function Text(options?: ITextOptions) {
  return function(object: any, property: string) {
    // use enum attribute, but later it will be deprecated
    AnnotationsHelper.forPropertyOn(object.constructor, property, {
      [K_FORM]: K_TEXT,
      ...(options ? options : {})
    });
  };
}
