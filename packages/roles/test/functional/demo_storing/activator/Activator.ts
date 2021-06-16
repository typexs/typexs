import {IActivator} from '@typexs/base';
import {BasicPermission, IPermissionDef, IPermissions, IRolesHolder} from '@typexs/roles-api';

class Perm implements IPermissionDef {

  permission: string;

  type?: 'single' | 'pattern';

  module?: string;

  desc?: string;

  handle?: (holder: IRolesHolder, ...args: any[]) => (boolean | Promise<boolean>);

  description?: string;


}


export class Activator implements IActivator, IPermissions {
  startup(): void {
  }

  permissions(): Promise<IPermissionDef[]> | IPermissionDef[] {
    return [
      new BasicPermission('basic'),
      {
        permission: 'with description',
        description: 'description is here'
      }
    ];
  }
}
