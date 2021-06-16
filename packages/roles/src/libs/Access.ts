import * as _ from 'lodash';
import {CryptUtils} from '@allgemein/base';
import {Cache, Inject} from '@typexs/base';
import {PermissionsRegistry} from './PermissionsRegistry';

import {IPermissionDef, IRole, IRolesHolder, ISecuredResource} from '@typexs/roles-api';
import {PermissionHelper} from '@typexs/roles-api/index';

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
    if (_.isEmpty(permissionValue)) {
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
    } else if (_.isString(permissionValue)) {
      permissionValues = [permissionValue];
    } else if (_.isArray(permissionValue) && _.isString(permissionValue[0])) {
      permissionValues = permissionValue;
    }

    permissionValues = _.uniq(permissionValues).sort();
    key.push(CryptUtils.shorthash(permissionValues.join('-')));
    const cacheKey = key.join('-');

    const res = await this.cache.get(cacheKey, this.cacheBin);
    if (!_.isNull(res)) {
      return res;
    }


    let allowed = false;
    const permissionDefs: IPermissionDef[] = this.getPermissions(permissionValues);
    if (!_.isEmpty(permissionDefs)) {
      const roles: IRole[] = await credential.getRoles();
      if (!_.isEmpty(roles)) {
        const permissions = this.getPermissions(PermissionHelper.getPermissionNamesFromRoles(roles));
        if (!_.isEmpty(permissions)) {
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
    const permissions = names.map(x => this.registry.find(x)).filter(x => !_.isEmpty(x));
    return permissions;
  }


}
