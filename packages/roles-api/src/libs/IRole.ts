import {IPermissionDef} from './IPermissionDef';

/**
 * role specification
 */
export interface IRole {

  /**
   * return the litaral name of the role
   */
  role: string;

  /**
   * return the litaral name of the role
   */
  label?: string;

  /**
   * return the litaral name of the role
   */
  description?: string;

  /**
   * return the with this role associated permissions
   */
  permissions?: (string | IPermissionDef)[];

}
