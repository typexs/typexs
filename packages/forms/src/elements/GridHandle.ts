import {defaults} from 'lodash';
import {FormObject} from '../lib/FormObject';
import {DEFAULT_GRID_OPTIONS, IGridOptions} from './IGridOptions';
import {ViewContent} from '@typexs/base/libs/bindings/decorators/ViewContent';
@ViewContent('grid')
export class GridHandle extends FormObject {

  options: IGridOptions = DEFAULT_GRID_OPTIONS;

  handleGrid(options: IGridOptions) {
    this.options = defaults(options, DEFAULT_GRID_OPTIONS);
    // mark that this is an structuring element
    this.handle('struct', true);
  }

}
