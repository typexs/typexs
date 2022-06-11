import { isEmpty, uniq } from 'lodash';
import { IActivator, Injector, Storage } from '@typexs/base';
import {
  PERMISSION_ALLOW_DISTRIBUTED_STORAGE_ACCESS_ENTITY,
  PERMISSION_ALLOW_DISTRIBUTED_STORAGE_DELETE_ENTITY,
  PERMISSION_ALLOW_DISTRIBUTED_STORAGE_SAVE_ENTITY,
  PERMISSION_ALLOW_DISTRIBUTED_STORAGE_UPDATE_ENTITY
} from './lib/Constants';
import { BasicPermission, IPermissionDef, IPermissions } from '@typexs/roles-api';


export class Activator implements IActivator, IPermissions {


  async startup() {
  }

  permissions(): IPermissionDef[] {

    let permissions: string[] = [

      /**
       * Distributed Storage Permissions
       */
      PERMISSION_ALLOW_DISTRIBUTED_STORAGE_ACCESS_ENTITY,
      PERMISSION_ALLOW_DISTRIBUTED_STORAGE_SAVE_ENTITY,
      PERMISSION_ALLOW_DISTRIBUTED_STORAGE_UPDATE_ENTITY,
      PERMISSION_ALLOW_DISTRIBUTED_STORAGE_DELETE_ENTITY

    ];
    permissions = uniq(permissions);


    // TODO how to solve dynamic task injection and concret permissions?

    return permissions.map(x => new BasicPermission(x));
  }


}
