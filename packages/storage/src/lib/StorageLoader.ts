import { C_DEFAULT } from '@allgemein/base';
import { Inject, IStorageRef, IStorageRefOptions, Log, RuntimeLoader, Storage } from '@typexs/base';
import { StorageSetting } from '../entities/storage/StorageSetting';
import { clone, set } from 'lodash';

export class StorageLoader {

  static NAME = 'StorageLoader';

  @Inject(Storage.NAME)
  storage: Storage;

  @Inject(RuntimeLoader.NAME)
  runtimeLoader: RuntimeLoader;

  storageRef: IStorageRef;

  active: boolean = false;

  async initialize() {
    this.storageRef = this.storage.forClass(StorageSetting);
    if (!this.storageRef) {
      Log.debug('Storage ref for backend settings not found.');
      return;
    }
    this.active = true;
    await this.loadStorageRefs();
  }

  getStorageRef() {
    return this.storageRef;
  }

  async loadStorageRefs() {
    if (!this.isActive()) {
      return [];
    }
    const settings = await this.storageRef.getController().find(StorageSetting, { active: true }, { limit: 0 });

    const refs = [];
    for (const setting of settings) {
      const ref = await this.loadByStorageSetting(setting);
      refs.push(ref);
    }
    return refs;
  }

  isActive() {
    return this.active;
  }

  async loadByStorageSetting(setting: StorageSetting): Promise<IStorageRef> {
    const storageName = setting.name + '_' + setting.id;
    const options: IStorageRefOptions = clone(setting.options);
    // TODO load classes / entities if present
    options.framework = setting.framework;
    set(options, 'name', setting.name);
    set(options, 'type', setting.type);
    return this.load(storageName, options);
  }


  async load(storageName: string, setting: IStorageRefOptions): Promise<IStorageRef> {
    const ref = this.storage.get(storageName);
    if (ref) {
      throw new Error(`Storage reference with this name ${storageName} already exists.`);
    }
    return this.storage.registerStorageRef(storageName, setting, this.runtimeLoader);
  }


}
