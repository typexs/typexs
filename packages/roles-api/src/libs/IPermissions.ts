import {IPermissionDef} from './IPermissionDef';

/**
 * Interface for permissions defintion implementation
 *
 * Permission are the rights module use to protect content by access control
 * The definition of permissions can be implemented on IActivator or IStartup.
 * Permissions generated at runtime can be added by through PermissionRegistry.
 *
 */
export interface IPermissions {

  /**
   * method returing declared modul permissions
   */
  permissions(): Promise<IPermissionDef[]> | IPermissionDef[];

}
