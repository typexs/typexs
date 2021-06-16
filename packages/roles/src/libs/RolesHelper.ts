import {Permission, Role} from '..';
import * as _ from 'lodash';
import {BasicPermission, IPermissionDef, IRole} from '@typexs/roles-api';
import {PermissionsRegistryLoader} from './PermissionsRegistryLoader';

export class RolesHelper {
  static async initRoles(loader: PermissionsRegistryLoader, cfgRoles: IRole[]) {
    const localRoles: Role[] = [];

    // collect permissions
    for (const cfgRole of cfgRoles) {


      const rolePermissions = _.get(cfgRole, 'permissions', []);
      let rolePermissionToSave: Permission[] = [];
      if (!_.isEmpty(rolePermissions)) {
        const rolePermissionSave: IPermissionDef[] = [];
        for (const rolePermission of rolePermissions) {
          if (_.isString(rolePermission)) {
            rolePermissionSave.push(new BasicPermission(rolePermission));
          } else {
            rolePermissionSave.push(rolePermission);
          }
        }

        if (!_.isEmpty(rolePermissionSave)) {
          rolePermissionToSave = await loader.getRegistry().loadDefs(rolePermissionSave);
          await loader.savePermissions(rolePermissionToSave);
        }
      }


      let role = await loader.findRole(cfgRole.role) as Role;

      if (!role) {
        role = new Role();
        role.role = cfgRole.role;
      }

      role.label = cfgRole.label ? cfgRole.label : null;
      role.description = cfgRole.description ? cfgRole.description : null;
      role.displayName = cfgRole.label ? cfgRole.label : null;
      role.disabled = false;
      role.permissions = rolePermissionToSave;
      localRoles.push(role);

    }

    if (!_.isEmpty(localRoles)) {
      await loader.saveRoles(localRoles);
    }
  }
}
