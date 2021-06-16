import {IPermissionDef} from './IPermissionDef';
import {IRolesHolder} from './IRolesHolder';
import {ISecuredResource} from './ISecuredResource';
import {IRole} from './IRole';


export class PermissionHelper {

  static MATCHER: any;

  static miniMatch(pattern: string, string: string) {
    try {
      if (!this.MATCHER) {
        this.MATCHER = require('@cezaryrk/minimatch');
      }
      return new this.MATCHER.Minimatch(pattern).match(string);
    } catch (e) {
      throw e;
    }
  }

  static getPermissionFromResource(obj: ISecuredResource) {
    const permissionNames = [].concat([], ...obj.getPermissions().map(p => p.permission));
    return permissionNames;
  }


  static getPermissionNamesFromRoles(roles: IRole[]) {
    const permissionNames = [].concat([],
      ...roles.map(x => [].concat([], ...x.permissions.map(p => typeof p === 'string' ? p : p.permission))));
    return permissionNames;
  }

  static getPermissionFromRoles(roles: IRole[]) {
    const permissions = [].concat([],
      ...roles.map(x => [].concat([], ...x.permissions)));
    return permissions;
  }

  static checkPermission(permissions: string[] | IPermissionDef[], permissionValue: string) {
    return this.checkPermissions(permissions, [permissionValue]);

    // let allowed = false;
    // let usePermissions: IPermissionDef[] = [];
    // if (permissions && permissions.length > 0 && typeof permissions[0] === 'string') {
    //   usePermissions = (permissions as string[]).map((x: string) => {
    //     return <IPermissionDef>{type: /\*/.test(x) ? 'pattern' : 'single', permission: x};
    //   });
    // } else {
    //   usePermissions = permissions as IPermissionDef[];
    // }
    //
    // for (const permission of usePermissions) {
    //   let matched = false;
    //   switch (permission.type || 'single') {
    //     case 'pattern':
    //       matched = !!this.miniMatch(permission.permission, permissionValue);
    //       break;
    //     default:
    //       matched = (permission.permission === permissionValue);
    //   }
    //   if (matched) {
    //     allowed = matched;
    //     break;
    //   }
    // }
    // return allowed;
  }


  static checkPermissions(
    permissions: string[] | IPermissionDef[], permissionValues: string[], holder?: IRolesHolder, resource?: ISecuredResource
  ) {
    return this.checkPermissionsFn((arr: boolean[]) => {
      return arr.reduce((previousValue, currentValue) => previousValue && currentValue);
    }, permissions, permissionValues, holder, resource);
  }


  static checkOnePermission(
    permissions: string[] | IPermissionDef[], permissionValues: string[], holder?: IRolesHolder, resource?: ISecuredResource
  ) {
    return this.checkPermissionsFn((arr: boolean[]) => {
      return arr.reduce((previousValue, currentValue) => previousValue || currentValue);
    }, permissions, permissionValues, holder, resource);
  }


  static checkAllPermissions(
    permissions: string[] | IPermissionDef[], permissionValues: string[], holder?: IRolesHolder, resource?: ISecuredResource
  ) {
    return this.checkPermissions(permissions, permissionValues, holder, resource);
  }


  static async checkPermissionsFn(
    reduce: (x: boolean[]) => boolean,
    permissions: string[] | IPermissionDef[],
    permissionValues: string[], holder?: IRolesHolder, resource?: ISecuredResource
  ) {
    let usePermissions: IPermissionDef[] = [];
    if (permissions && permissions.length > 0 && typeof permissions[0] === 'string') {
      usePermissions = (permissions as string[]).map((x: string) => {
        return <IPermissionDef>{type: /\*/.test(x) ? 'pattern' : 'single', permission: x};
      });
    } else {
      usePermissions = permissions as IPermissionDef[];
    }

    const arrAllowed: boolean[] = permissionValues.map(x => false);
    let allowed = false;
    for (const permission of usePermissions) {
      for (let i = 0; i < permissionValues.length; i++) {
        if (arrAllowed[i]) {
          continue;
        }
        const permissionValue = permissionValues[i];
        const reversePattern = /\*/.test(permissionValue);

        let _allowed = false;
        switch (permission.type || 'single') {
          case 'pattern':
            _allowed = !!this.miniMatch(permission.permission, permissionValue);
            break;
          default:
            _allowed = permissionValue === permission.permission;
        }

        // reverse check if cross pattern
        if (!_allowed && reversePattern) {
          const usePermSplit = permission.permission.split(' ');
          const checkPermSplit = permissionValue.split(' ');
          if (usePermSplit.length === checkPermSplit.length) {
            for (let i = 0; i < usePermSplit.length; i++) {
              if (usePermSplit[i] === '*' || checkPermSplit[i] === '*') {
                _allowed = true;
              } else if (usePermSplit[i] === checkPermSplit[i]) {
                _allowed = true;
              } else {
                _allowed = false;
                break;
              }
            }
          }
        }

        if (_allowed) {
          const handle = permission.handle;
          if (handle) {
            arrAllowed[i] = await handle(holder, resource, this);
          } else {
            arrAllowed[i] = true;
          }
        } else {
          arrAllowed[i] = false;
        }
      }

      // if (mode === 'all') {
      //   allowed = arrAllowed.reduce((previousValue, currentValue) => previousValue && currentValue);
      // } else if () {
      //
      // }
      allowed = reduce(arrAllowed);
      if (allowed) {
        break;
      }
    }
    return allowed;
  }

}
