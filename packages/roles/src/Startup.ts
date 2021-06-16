import * as _ from 'lodash';
import {Bootstrap, Config, IBootstrap, Inject} from '@typexs/base';
import {PermissionsRegistry} from './libs/PermissionsRegistry';
import {PermissionsRegistryLoader} from './libs/PermissionsRegistryLoader';
import {BasicPermission, IPermissionDef, IRole} from '@typexs/roles-api';
import {RolesHelper} from './libs/RolesHelper';

export class Startup implements IBootstrap {


  @Inject(PermissionsRegistryLoader.NAME)
  private loader: PermissionsRegistryLoader;

  @Inject(PermissionsRegistry.NAME)
  private registry: PermissionsRegistry;


  async bootstrap() {
    await this.loader.loadInitialBackend();

    const modulActivators = Bootstrap._().getActivators() as any[];
    let permissions = await this.registry.loadFrom(modulActivators);
    await this.loader.savePermissions(permissions);

    const modulStartups = Bootstrap._().getModulBootstraps() as any[];
    permissions = await this.registry.loadFrom(modulStartups);
    await this.loader.savePermissions(permissions);

    const localPermissionDefs: IPermissionDef[] = [];
    const cfgPermissions = Config.get('initialise.permissions', []);
    if (_.isArray(cfgPermissions)) {
      for (const _p of cfgPermissions) {
        if (_.isString(_p)) {
          localPermissionDefs.push(new BasicPermission(_p));
        } else {
          if (_p.permission) {
            const p = new BasicPermission(_p.permission);
            localPermissionDefs.push(p);
            _.assign(p, _p);
          }
        }
      }

      if (!_.isEmpty(localPermissionDefs)) {
        permissions = await this.registry.loadDefs(localPermissionDefs);
        await this.loader.savePermissions(permissions);
      }
    }

    const cfgRoles = Config.get('initialise.roles', []) as IRole[];
    await RolesHelper.initRoles(this.loader, cfgRoles);


  }


}
