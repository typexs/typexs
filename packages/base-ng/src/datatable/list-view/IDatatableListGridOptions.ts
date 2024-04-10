import { IDatatableOptions } from '../api/IDatatableOptions';
import { IViewOptions } from '../../component/view/IViewOptions';

export interface IDatatableListGridOptions extends IDatatableOptions {
  viewOptions?: IViewOptions;
}
