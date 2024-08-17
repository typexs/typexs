import { IDatatableOptions } from '../api/IDatatableOptions';
import { IViewOptions } from '../../component/view/IViewOptions';

export interface IDatatableListGridOptions extends IDatatableOptions {

  viewOptions?: IViewOptions;

  /**
   * Defines the mode of infinite view
   */
  infiniteMode?: 'simple' | 'overflow';

  /**
   * Adapt scrollbar to max entries
   */
  adaptScrollbar?: boolean;
}
