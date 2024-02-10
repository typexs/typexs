import { Config, IActivator, Injector, Storage } from '@typexs/base';
import { StorageLoader } from './lib/StorageLoader';
import { isEmpty, uniq } from 'lodash';
import { IEntityRef } from '@allgemein/schema-api';
import { BasicPermission, IPermissionDef } from '@typexs/roles-api';
import { EntitySchema } from 'typeorm';
import {
  PERMISSION_ALLOW_ACCESS_STORAGE_ENTITY,
  PERMISSION_ALLOW_ACCESS_STORAGE_ENTITY_PATTERN,
  PERMISSION_ALLOW_ACCESS_STORAGE_METADATA,
  PERMISSION_ALLOW_DELETE_STORAGE_ENTITY,
  PERMISSION_ALLOW_DELETE_STORAGE_ENTITY_PATTERN,
  PERMISSION_ALLOW_SAVE_STORAGE_ENTITY,
  PERMISSION_ALLOW_SAVE_STORAGE_ENTITY_PATTERN,
  PERMISSION_ALLOW_STORAGE_ACTIVE,
  PERMISSION_ALLOW_STORAGE_ENTITIES,
  PERMISSION_ALLOW_STORAGE_TEST,
  PERMISSION_ALLOW_STORAGES_VIEW,
  PERMISSION_ALLOW_UPDATE_STORAGE_ENTITY,
  PERMISSION_ALLOW_UPDATE_STORAGE_ENTITY_PATTERN
} from './lib/Constants';
import { IStorageLoaderOptions } from './lib/IStorageLoaderOptions';

/**
 * Default storage at @typexs/base should already be loaded, so now we can attached
 * storage sources declared in the declared backend ;)
 *
 * Load storage configurations from StorageRef
 */
export class Activator implements IActivator {

  async startup() {
    const loader = Injector.get(StorageLoader);
    if (loader) {
      const opts: IStorageLoaderOptions = {
        autoload: Config.get('storage._autoload', false)
      };
      await loader.initialize(opts);
    }
  }


  permissions(): IPermissionDef[] {

    let permissions: string[] = [
      // runtime
      PERMISSION_ALLOW_STORAGES_VIEW,
      PERMISSION_ALLOW_STORAGE_ENTITIES,
      PERMISSION_ALLOW_STORAGE_TEST,
      PERMISSION_ALLOW_STORAGE_ACTIVE,

      /**
       * Storage Permissions
       */
      PERMISSION_ALLOW_ACCESS_STORAGE_METADATA,
      PERMISSION_ALLOW_ACCESS_STORAGE_ENTITY,
      PERMISSION_ALLOW_SAVE_STORAGE_ENTITY,
      PERMISSION_ALLOW_UPDATE_STORAGE_ENTITY,
      PERMISSION_ALLOW_DELETE_STORAGE_ENTITY
    ];

    permissions = uniq(permissions.filter(x => !isEmpty(x)));

    const storage = Injector.get(Storage.NAME) as Storage;
    for (const name of storage.getNames()) {
      const ref = storage.get(name);
      const entities = ref.getOptions().entities;
      if (entities) {
        for (const entity of entities) {
          let eRef = null;
          if (entity instanceof EntitySchema) {
            eRef = ref.getEntityRef(entity.options.target) as IEntityRef;
          } else {
            eRef = ref.getEntityRef(entity) as IEntityRef;
          }

          if (eRef) {
            permissions.push(PERMISSION_ALLOW_ACCESS_STORAGE_ENTITY_PATTERN.replace(':name', eRef.machineName));
            permissions.push(PERMISSION_ALLOW_SAVE_STORAGE_ENTITY_PATTERN.replace(':name', eRef.machineName));
            permissions.push(PERMISSION_ALLOW_UPDATE_STORAGE_ENTITY_PATTERN.replace(':name', eRef.machineName));
            permissions.push(PERMISSION_ALLOW_DELETE_STORAGE_ENTITY_PATTERN.replace(':name', eRef.machineName));
          }
        }
      }
    }

    permissions = uniq(permissions);


    // TODO how to solve dynamic task injection and concret permissions?

    return permissions.map(x => new BasicPermission(x));
  }


}
