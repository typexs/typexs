import { isArray, isEmpty, isNull, isString, uniq } from '@typexs/generic';


import { CryptUtils } from '@allgemein/base';
import { Cache, Inject } from '@typexs/base';
import { PermissionsRegistry } from './PermissionsRegistry';

import { IPermissionDef, IRole, IRolesHolder, ISecuredResource } from '@typexs/roles-api';
import { PermissionHelper } from '@typexs/roles-api/index';

/**
 * Access
 */
export class Access {

  cacheBin: string = 'access';

  @Inject(PermissionsRegistry.NAME)
  registry: PermissionsRegistry;

  @Inject(Cache.NAME)
  cache: Cache;

  // validate(credential: IRolesHolder, permissionValue: string);
  async validate(credential: IRolesHolder, permissionValue: string | string[] | ISecuredResource, mode: 'one' | 'all' = 'one') {
    if (isEmpty(permissionValue)) {
      return false;
    }
    // get permission
    const key = [
      'access',
      credential.getIdentifier(),
    ];

    let resource: ISecuredResource = null;
    let permissionValues: string[] = [];
    if (permissionValue['getIdentifier'] && permissionValue['getPermissions']) {
      resource = <ISecuredResource>permissionValue;
      permissionValues = PermissionHelper.getPermissionFromResource(resource);
      key.push(resource.getIdentifier());
    } else if (isString(permissionValue)) {
      permissionValues = [permissionValue];
    } else if (isArray(permissionValue) && isString(permissionValue[0])) {
      permissionValues = permissionValue;
    }

    permissionValues = uniq(permissionValues).sort();
    key.push(CryptUtils.shorthash(permissionValues.join('-')));
    const cacheKey = key.join('-');

    const res = await this.cache.get(cacheKey, this.cacheBin);
    if (!isNull(res)) {
      return res;
    }


    let allowed = false;
    const permissionDefs: IPermissionDef[] = this.getPermissions(permissionValues);
    if (!isEmpty(permissionDefs)) {
      const roles: IRole[] = await credential.getRoles();
      if (!isEmpty(roles)) {
        const permissions = this.getPermissions(PermissionHelper.getPermissionNamesFromRoles(roles));
        if (!isEmpty(permissions)) {
          if (mode === 'all') {
            allowed = await PermissionHelper.checkAllPermissions(permissions, permissionValues, credential, resource);
          } else {
            allowed = await PermissionHelper.checkOnePermission(permissions, permissionValues, credential, resource);
          }
        }
      }
    }

    await this.cache.set(cacheKey, allowed, this.cacheBin, {ttl: 3600});
    return allowed;
  }


  getPermissions(names: string[]) {
    const permissions = names.map(x => this.registry.find(x)).filter(x => !isEmpty(x));
    return permissions;
  }


}
