import {IBootstrap} from '@typexs/base';
import {BasicPermission, IPermissionDef, IPermissions, IRolesHolder} from '@typexs/roles-api';

class Perm implements IPermissionDef {

  permission: string;

  type?: 'single' | 'pattern';

  module?: string;

  description?: string;

  handle?: (holder: IRolesHolder, ...args: any[]) => (boolean | Promise<boolean>);
}


export class Startup implements IBootstrap, IPermissions {
  bootstrap(): void {
  }

  permissions(): Promise<IPermissionDef[]> | IPermissionDef[] {
    return [
      new BasicPermission('basic2'),
      {
        permission: 'with description2',
        description: 'description is here'
      }
    ];
  }
}
