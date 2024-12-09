import { concat, has, isEmpty, isString } from '@typexs/generic';
import { IPermissionDef, IPermissions } from '@typexs/roles-api';
import { Permission } from '../entities/Permission';
import { Log } from '@typexs/base';


const MODULE_NAME = '__MODULNAME__';


/**
 * Registry for permissions holding
 */
export class PermissionsRegistry {

  static NAME: string = PermissionsRegistry.name;

  // TODO dynamic permissions loader
  permissions: Permission[] = [];

  /**
   * Method to get the modul name of the class
   *
   * @param cls
   */
  static getModulName(cls: Function) {
    if (Reflect && Reflect['getOwnMetadata']) {
      // @ts-ignore
      return Reflect['getOwnMetadata'](MODULE_NAME, cls);
    } else {
      return cls[MODULE_NAME] ? cls[MODULE_NAME] : null;
    }
  }


  /**
   * Load permissions from classes implementing IPermissions
   *
   * @param impls
   */
  async loadFrom(impls: IPermissions[]) {
    // collect permissions
    let permissions: Permission[] = [];
    for (const activator of impls) {
      const ipermissions: IPermissions = (<IPermissions>(<any>activator));
      if (ipermissions.permissions) {
        const _module = PermissionsRegistry.getModulName((<any>ipermissions).__proto__.constructor);
        const modul_permissions = (await ipermissions.permissions()).filter(x => !isEmpty(x));
        const loadedPermissions = await this.loadDefs(modul_permissions, _module);
        permissions = concat(permissions, loadedPermissions);
      }
    }
    return permissions;
  }


  /**
   * Load permissions from classes implementing IPermissions
   *
   * @param impls
   */
  async loadDefs(permissions: IPermissionDef[], _module: string = 'default') {
    // collect permissions
    const retPermissions: any[] = [];

    for (const p of permissions) {

      let permissionName: string = null;
      const permission = new Permission();
      if (isString(p)) {
        // deprecated only permission name
        permissionName = p;
      } else if (has(p, 'permission')) {
        permissionName = p.permission;
      }

      if (!permissionName) {
        Log.warn(`Can't identify name ${permissionName} of ${p}.  Skipping entry ...`);
        continue;
      }

      const dublett = retPermissions.find(x => x.permission === permissionName);
      if (dublett) {
        Log.debug(`Doublet's name ${permissionName} already set ${JSON.stringify(dublett)}.`);
        continue;
      }

      if (isString(p)) {
        // deprecated only permission name
        permission.permission = permissionName;
        permission.module = _module || 'default';
        permission.type = /\*/.test(permission.permission) ? 'pattern' : 'single';
        permission.description = null;
        permission.handle = null;
      } else {
        permission.permission = permissionName;
        permission.module = p.module ? p.module : _module;
        permission.type = p.type ? p.type : /\*/.test(permission.permission) ? 'pattern' : 'single';
        permission.description = p.description ? p.description : null;
        permission.handle = p.handle ? p.handle : null;
      }

      permission.disabled = false;

      retPermissions.push(this.add(permission));
    }

    return retPermissions;
  }


  /**
   * Add new permission or return the existing
   *
   * @param p
   */
  add(p: Permission) {
    const exists = this.permissions.find(x => x.permission === p.permission);
    if (!exists) {
      this.permissions.push(p);
      return p;
    }
    return exists;
  }

  /**
   * Find permissions by name
   *
   * @param permission
   */
  find(permission: string): Permission;
  find(permission: string[]): Permission[];
  find(permission: string | string[]): Permission | Permission[] {
    if (isString(permission)) {
      return this.permissions.find(x => x.permission === permission);
    }
    return this.permissions.filter(x => permission.includes(x.permission));
  }


}
