import {AnnotationsHelper} from '@allgemein/schema-api';
import { C_ENTITY_LABEL } from '../../Constants';

export function Label() {
  return function (object: any, property: string) {
    // use enum attribute, but later it will be deprecated
    AnnotationsHelper.forPropertyOn(object.constructor, property, {[C_ENTITY_LABEL]: true});
  };
}
