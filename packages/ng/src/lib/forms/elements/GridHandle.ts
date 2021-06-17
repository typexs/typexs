import {defaults} from 'lodash';
import {FormObject} from '../FormObject';
import {ViewContent} from '../../views/decorators/ViewContent';
import {DEFAULT_GRID_OPTIONS, IGridOptions} from './IGridOptions';

@ViewContent('grid')
export class GridHandle extends FormObject {

  options: IGridOptions = DEFAULT_GRID_OPTIONS;

  handleGrid(options: IGridOptions) {
    this.options = defaults(options, DEFAULT_GRID_OPTIONS);
    // mark that this is an structuring element
    this.handle('struct', true);
  }

}
