import * as _ from 'lodash';
import {C_STORAGE_DEFAULT, Inject, Injector, StorageRef} from '@typexs/base';
import {Permission} from '../entities/Permission';
import {PermissionsRegistry} from './PermissionsRegistry';
import {Role} from '../entities/Role';
import {EntityController} from '@typexs/schema';

export class PermissionsRegistryLoader {


  static NAME: string = PermissionsRegistryLoader.name;


  @Inject(PermissionsRegistry.NAME)
  private registry: PermissionsRegistry;


  private _entityController: EntityController;


  private _storageRef: StorageRef;

  /**
   * Initial load of permissions
   *
   * Mark all permissions (which are not defined manuel, can be identified by module === 'default')
   * with disabled = true, to identify active once.
   */
  async loadInitialBackend() {
    const permissions = await this.getStorageRef().getController().find(Permission, {}, {limit: 0}) as Permission[];
    for (let permission of permissions) {
      permission = this.registry.add(permission);
      if (permission.module !== 'default') {
        permission.disabled = true;
      }
    }
  }


  async savePermissions(p: Permission[]) {
    if (!_.isEmpty(p)) {
      const names = p.map(x => x.permission);
      const save: Permission[] = [];
      const exists = await this.getStorageRef().getController().find(Permission, {permission: {$in: names}}, {limit: 0}) as Permission[];
      for (const perm of p) {
        const already = !!save.find(x => x.permission === perm.permission);
        if (already) {
          continue;
        }
        const found = exists.find(x => x.permission === perm.permission);
        if (found) {
          perm.id = found.id;
        }
        save.push(perm);
      }

      if (!_.isEmpty(save)) {
        await this.getStorageRef().getController().save(save);
      }

    }
    return p;
  }


  async findRole(name: string) {
    return this.getEntityController().findOne(Role, {rolename: name}, {limit: 1});
  }


  async saveRoles(p: Role[]) {
    if (!_.isEmpty(p)) {
      await this.getEntityController().save(p);
    }
    return p;
  }


  private getEntityController() {
    if (!this._entityController) {
      this._entityController = Injector.get('EntityController.default');
    }
    return this._entityController;

  }

  private getStorageRef() {
    if (!this._storageRef) {
      this._storageRef = Injector.get(C_STORAGE_DEFAULT);
    }
    return this._storageRef;

  }

  getRegistry() {
    return this.registry;
  }
}
