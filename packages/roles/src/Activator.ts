import { IActivator, Injector } from '@typexs/base';
import { PermissionsRegistry } from './libs/PermissionsRegistry';
import { PermissionsRegistryLoader } from './libs/PermissionsRegistryLoader';
import { BasicPermission, IPermissionDef, IPermissions } from '@typexs/roles-api';

export class Activator implements IActivator, IPermissions {


  startup(): void {
    const r = Injector.create(PermissionsRegistry);
    Injector.set(PermissionsRegistry.NAME, r);

    const l = Injector.create(PermissionsRegistryLoader);
    Injector.set(PermissionsRegistryLoader.NAME, l);
  }


  permissions(): Promise<IPermissionDef[]> | IPermissionDef[] {
    return [
      new BasicPermission('*')
    ];
  }

}
