import { IGridOptions } from '../elements/IGridOptions';
import { AnnotationsHelper } from '@allgemein/schema-api';
import { K_FORM, K_GRID } from '../lib/Constants';

export function Grid(options: IGridOptions = {}) {
  return function(object: any, property: string) {
    AnnotationsHelper.forPropertyOn(object.constructor, property, {
      [K_FORM]: K_GRID,
      [K_GRID]: options
    });
  };
}
