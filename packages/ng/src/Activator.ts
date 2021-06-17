import {BasicPermission, IPermissionDef, IPermissions} from '@typexs/roles-api';
import {PERMISSION_ACCESS_ADMIN_UI} from './lib/Constants';

export class Activator implements IPermissions {
  permissions(): IPermissionDef[] {
    return [
      new BasicPermission(PERMISSION_ACCESS_ADMIN_UI),
    ];
  }
}
