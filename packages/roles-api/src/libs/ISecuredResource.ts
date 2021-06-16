/**
 * Defines a secured resource
 */
import {IPermissionDef} from './IPermissionDef';

export interface ISecuredResource {

  /**
   * return a unique identifier for the resource
   */
  getIdentifier(): string | number;


  /**
   * return a unique identifier for the resource
   */
  getPermissions(): IPermissionDef[];


}
