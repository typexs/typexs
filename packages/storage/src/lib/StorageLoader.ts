import { Inject, IStorageRef, IStorageRefOptions, Log, RuntimeLoader, Storage } from '@typexs/base';
import { StorageSetting } from '../entities/storage/StorageSetting';
import { clone, defaults, set } from 'lodash';

export interface IStorageLoaderOptions {
  autoload: boolean;
}

export class StorageLoader {

  static NAME = 'StorageLoader';

  @Inject(() => Storage)
  storage: Storage;

  @Inject(() => RuntimeLoader)
  runtimeLoader: RuntimeLoader;

  storageRef: IStorageRef;

  active: boolean = false;

  options: IStorageLoaderOptions;

  async initialize(options?: IStorageLoaderOptions) {
    this.options = defaults(options || {}, { autoload: false });
    this.storageRef = this.storage.forClass(StorageSetting);
    if (!this.storageRef) {
      Log.debug('Storage ref for backend settings not found.');
      return;
    }
    this.active = true;
    await this.loadActiveStorageRefs();
  }

  getStorageRef() {
    return this.storageRef;
  }


  getOptions() {
    return this.options;
  }

  /**
   * Load dynamic configured storage references
   */
  async loadActiveStorageRefs() {
    if (!this.isActive()) {
      return [];
    }
    const settings = await this.storageRef.getController().find(StorageSetting, { active: true }, { limit: 0 });
    return this.loadByStorageSettings(settings);
  }

  /**
   * Check if is active, so when StorageSetting are handled by some repo
   */
  isActive() {
    return this.active;
  }


  /**
   * Load a list of StorageSettings
   *
   * @param settings
   */
  async loadByStorageSettings(settings: StorageSetting[]): Promise<IStorageRef[]> {
    const refs = [];
    for (const setting of settings) {
      const ref = await this.loadByStorageSetting(setting);
      refs.push(ref);
    }
    return refs;

  }

  /**
   * Load a single StorageSetting
   *
   * @param settings
   */
  async loadByStorageSetting(setting: StorageSetting): Promise<IStorageRef> {
    const storageName = setting.name + '_' + setting.id;
    const options: IStorageRefOptions = clone(setting.options);
    // TODO load classes / entities if present
    options.framework = setting.framework;
    set(options, 'name', setting.name);
    set(options, 'type', setting.type);
    return this.load(storageName, options);
  }


  /**
   * Load by storageName and passed options
   *
   * @param settings
   */
  async load(storageName: string, setting: IStorageRefOptions): Promise<IStorageRef> {
    const ref = this.storage.get(storageName);
    if (ref) {
      throw new Error(`Storage reference with this name ${storageName} already exists.`);
    }
    return this.storage.registerStorageRef(storageName, setting, this.runtimeLoader);
  }


}
