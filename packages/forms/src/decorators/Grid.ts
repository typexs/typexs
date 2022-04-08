import {IGridOptions} from '../elements/IGridOptions';
import {AnnotationsHelper} from '@allgemein/schema-api';

export function Grid(options: IGridOptions = {}) {
  return function (object: any, property: string) {
    AnnotationsHelper.forPropertyOn(object.constructor, property, {form: 'grid', grid: options});
  };
}
