import {AnnotationsHelper} from '@allgemein/schema-api';
import { C_FLEXIBLE } from '../libs/storage/Constants';

/**
 * Mark entity as flexible, so not declared properties will not be ignored or stripped (use on Mongo + Elastic)
 *
 * @constructor
 */
export function FlexibleProperties() {
  return function (object: Function) {
    AnnotationsHelper.forEntityOn(object, {[C_FLEXIBLE]: true});
  };
}

