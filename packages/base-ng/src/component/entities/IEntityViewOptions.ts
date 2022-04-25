import { IEntityResolveOptions } from '../../services/IEntityResolveOptions';
import { IViewOptions } from '../view/IViewOptions';

export interface IEntityViewOptions extends IViewOptions {

  /**
   * Request options
   */
  req?: {
    raw?: boolean;
  };

  /**
   * Add entity resolver options
   */
  resolver?: IEntityResolveOptions;


}
