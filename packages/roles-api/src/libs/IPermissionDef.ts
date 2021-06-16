import {IRolesHolder} from './IRolesHolder';

/**
 * permission specification
 */
export interface IPermissionDef {

  /**
   * Name
   */
  permission: string;

  /**
   * Description
   */
  description?: string;

  /**
   * Description
   */
  module?: string;

  /**
   * own check
   */
  handle?: (holder: IRolesHolder, ...args: any[]) => boolean | Promise<boolean>;


  /**
   * own check
   */
  type?: 'single' | 'pattern';


}
