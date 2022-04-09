import { AnnotationsHelper } from '@allgemein/schema-api';
import { K_FORM } from '../lib/Constants';

export function Type(options: { form: string; [k: string]: any }) {
  return function(object: any, property: string) {
    const opts: any = { [K_FORM]: options.form };
    opts[options[K_FORM]] = options;
    delete opts[options[K_FORM]][K_FORM];
    AnnotationsHelper.forPropertyOn(object.constructor, property, opts);
  };
}
