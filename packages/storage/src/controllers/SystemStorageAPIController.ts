import { C_CONFIG_FILTER_KEYS, ClassLoader, Inject, Invoker, IStorageRefOptions, RuntimeLoader, Storage, System, Injector } from '@typexs/base';
import { Get, HttpError, JsonController, Param } from 'routing-controllers';
import { getMetadataArgsStorage as ormMetadataArgsStorage } from 'typeorm';
import { _API_CTRL_SYSTEM, Access, C_API, ContextGroup, ServerStatusApi, SystemNodeInfoApi, WalkValues } from '@typexs/server';
import { TreeUtils } from '@allgemein/base';
import {
  _API_CTRL_SYSTEM_STORAGE_ACTIVE,
  _API_CTRL_SYSTEM_STORAGE_ENTITIES,
  _API_CTRL_SYSTEM_STORAGE_TEST,
  _API_CTRL_SYSTEM_STORAGES,
  PERMISSION_ALLOW_STORAGE_ACTIVE,
  PERMISSION_ALLOW_STORAGE_ENTITIES,
  PERMISSION_ALLOW_STORAGE_TEST,
  PERMISSION_ALLOW_STORAGES_VIEW
} from '../lib/Constants';
import { cloneDeepWith, concat, isArray, isEmpty, isFunction, isString, map, uniq } from 'lodash';
import { TestStorageSettings } from '../ops/TestStorageSettings';
import { StorageLoader } from '../lib/StorageLoader';
import { ActivateStorageSetting } from '../ops/ActivateStorageSetting';
import { SystemStorageInfoApi } from '../api/SystemStorageInfo.api';

@ContextGroup(C_API)
@JsonController(_API_CTRL_SYSTEM)
export class SystemStorageAPIController {

  @Inject(System.NAME)
  system: System;

  @Inject(RuntimeLoader.NAME)
  loader: RuntimeLoader;

  @Inject(Storage.NAME)
  storage: Storage;

  @Inject(() => StorageLoader)
  storageLoader: StorageLoader;

  @Inject(Invoker.NAME)
  invoker: Invoker;


  /**
   * Get storage info
   */
  @Access(PERMISSION_ALLOW_STORAGES_VIEW)
  @Get(_API_CTRL_SYSTEM_STORAGES)
  async getStorageInfo(): Promise<IStorageRefOptions[]> {
    const settings: IStorageRefOptions[] = [];

    const filterKeys = this.getFilterKeys();
    for (const refOptions of this.storage.getAllOptions()) {
      const options = cloneDeepWith(refOptions);
      TreeUtils.walk(options, (x: WalkValues) => {
        if (isString(x.key) && filterKeys.indexOf(x.key) !== -1) {
          delete x.parent[x.key];
        }
        if (isFunction(x.value)) {
          if (isArray(x.parent)) {
            x.parent[x.index] = ClassLoader.getClassName(x.value);
          } else {
            x.parent[x.key] = ClassLoader.getClassName(x.value);
          }
        }
      });
      options.active = true;
      options.mode = 'config';
      settings.push(options);
    }

    const _settings = await this.storageLoader.getStorageSettings();
    for (const setting of _settings) {
      const options = cloneDeepWith(setting.options);
      options.id = setting.id;
      options.active = true;
      options.mode = 'db';
      settings.push(options);
    }
    this.invoker.use(SystemStorageInfoApi).prepareStorageInfo(settings);
    return settings;
  }


  /**
   * Test a storage reference connection
   */
  @Access(PERMISSION_ALLOW_STORAGE_TEST)
  @Get(_API_CTRL_SYSTEM_STORAGE_TEST)
  async testStorageReference(@Param('idOrName') idOrName: string) {
    const setting = await this.storageLoader.getStorageSetting(idOrName);
    const op = Injector.create(TestStorageSettings);
    const res = await op.doCall(setting);
    if (res.error) {
      throw new HttpError(500, res.error.message);
    }
    return res.success;
  }


  /**
   * Activate a storage reference connection
   */
  @Access(PERMISSION_ALLOW_STORAGE_ACTIVE)
  @Get(_API_CTRL_SYSTEM_STORAGE_ACTIVE)
  async activeStorageReference(@Param('idOrName') idOrName: string) {
    const setting = await this.storageLoader.getStorageSetting(idOrName);
    const op = Injector.create(ActivateStorageSetting);
    const res = await op.doCall(setting);
    if (res.error) {
      throw new HttpError(500, res.error.message);
    }
    return res.success;
  }


  /**
   * Get entities registered in a storage reference
   */
  @Access(PERMISSION_ALLOW_STORAGE_ENTITIES)
  @Get(_API_CTRL_SYSTEM_STORAGE_ENTITIES)
  getStorageEntities(@Param('name') name: string): any[] {
    const ref = this.storage.get(name);
    const entityNames = map(ref.getOptions().entities, e => {
      if (isString(e)) {
        return e;
      } else if (isFunction(e)) {
        return ClassLoader.getClassName(e);
      } else {
        return (<any>e).options.name;
      }
    });

    const tables = cloneDeepWith(ormMetadataArgsStorage().tables
      .filter(t => entityNames.indexOf(ClassLoader.getClassName(t.target)) !== -1));

    TreeUtils.walk(tables, (x: WalkValues) => {
      if (isFunction(x.value)) {
        if (isArray(x.parent)) {
          x.parent[x.index] = ClassLoader.getClassName(x.value);
        } else {
          x.parent[x.key] = ClassLoader.getClassName(x.value);
        }
      }
    });
    this.invoker.use(SystemNodeInfoApi).prepareStorageEntities(tables);
    return tables;
  }


  private getFilterKeys(): string[] {
    // TODO cache this!
    let filterKeys = C_CONFIG_FILTER_KEYS; // get them from base/ConfigUtils
    const res: string[][] = <string[][]><any>this.invoker.use(SystemStorageInfoApi).filterConfigKeys();
    if (res && isArray(res)) {
      filterKeys = uniq(concat(filterKeys, ...res.filter(x => isArray(x))).filter(x => !isEmpty(x)));
    }
    return filterKeys;
  }


}
