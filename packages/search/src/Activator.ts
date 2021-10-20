import { IActivator } from '@typexs/base';
import { BasicPermission, IPermissionDef, IPermissions } from '@typexs/roles-api';
import { PERMISSION_ACCESS_SEARCH_VIEW } from './lib/Constants';

export class Activator implements IActivator, IPermissions {

  startup() {
  }

  permissions(): Promise<IPermissionDef[]> | IPermissionDef[] {
    return [new BasicPermission(PERMISSION_ACCESS_SEARCH_VIEW)];
  }
}
