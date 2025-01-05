import { isEmpty, uniq } from 'lodash';
import { IActivator, Injector } from '@typexs/base';
import { ServerRegistry } from './libs/server/ServerRegistry';
import {
  PERMISSION_ACCESS_FILES,
  PERMISSION_ALLOW_ACCESS_REGISTRY_ENTITY_REFS,
  PERMISSION_ALLOW_ACCESS_REGISTRY_NAMESPACES,
  PERMISSION_ALLOW_ACCESS_REGISTRY_SCHEMAS,
  PERMISSION_ALLOW_MODULES_VIEW,
  PERMISSION_ALLOW_RUNTIME_INFO_VIEW,
  PERMISSION_ALLOW_RUNTIME_NODE_VIEW,
  PERMISSION_ALLOW_RUNTIME_NODES_VIEW,
  PERMISSION_ALLOW_RUNTIME_REMOTE_INFOS_VIEW,
  PERMISSION_ALLOW_WORKERS_INFO
} from './libs/Constants';
import { BasicPermission, IPermissionDef, IPermissions } from '@typexs/roles-api';
import { CONFIG_SCHEMA } from './config.schema';


export class Activator implements IActivator, IPermissions {

  configSchema(): any {
    return CONFIG_SCHEMA;
  }

  async startup() {
    const serverRegistry = new ServerRegistry();
    Injector.set(ServerRegistry, serverRegistry);
    Injector.set('ServerRegistry', serverRegistry);
  }

  permissions(): IPermissionDef[] {

    let permissions: string[] = [
      /**
       * Runtime Permissions
       */
      PERMISSION_ALLOW_RUNTIME_INFO_VIEW,
      PERMISSION_ALLOW_RUNTIME_NODE_VIEW,
      PERMISSION_ALLOW_RUNTIME_NODES_VIEW,
      PERMISSION_ALLOW_RUNTIME_REMOTE_INFOS_VIEW,
      PERMISSION_ALLOW_WORKERS_INFO,

      /**
       * Modul Permissions
       */
      PERMISSION_ALLOW_MODULES_VIEW,

      /**
       * File Permissions
       */
      PERMISSION_ACCESS_FILES,

      /**
       * Registry Permissions
       */
      PERMISSION_ALLOW_ACCESS_REGISTRY_NAMESPACES,
      PERMISSION_ALLOW_ACCESS_REGISTRY_SCHEMAS,
      PERMISSION_ALLOW_ACCESS_REGISTRY_ENTITY_REFS
      // PERMISSION_ALLOW_ACCESS_REGISTRY_ENTITY_REFS_BY_NAMESPACE
    ];


    permissions = uniq(permissions.filter(x => !isEmpty(x)));
    permissions = uniq(permissions);

    // TODO how to solve dynamic task injection and concret permissions?

    return permissions.map(x => new BasicPermission(x));
  }


}
