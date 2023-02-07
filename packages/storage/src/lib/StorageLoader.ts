import { Inject, IStorageRef, IStorageRefOptions, Log, RuntimeLoader, Storage } from '@typexs/base';
import { StorageSetting } from '../entities/storage/StorageSetting';
import { clone, defaults, isString, set } from 'lodash';

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
   * Return all storage settings
   *
   * @param id
   */
  getStorageSettings() {
    return this.storageRef.getController().find(StorageSetting, null, { limit: 0 });
  }

  /**
   * Return a single storage setting by id
   *
   * @param id
   */
  getStorageSetting(idOrName: number | string) {
    let id = null;
    if (isString(idOrName)) {
      const resolve = StorageSetting.resolveId(idOrName);
      id = resolve.id;
    } else {
      id = idOrName;
    }
    return this.storageRef.getController().findOne(StorageSetting, { id: id });
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
    const storageName = setting.getId();
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
    if (this.isLoaded(storageName)) {
      throw new Error(`Storage reference with this name ${storageName} already exists.`);
    }
    return this.storage.registerStorageRef(storageName, setting, this.runtimeLoader);
  }


  /**
   * Check if storage is already loaded
   *
   * @param storageName
   */
  isLoaded(storageName: string) {
    const ref = this.storage.get(storageName);
    return !!ref;
  }


  /**
   *  Pass unregister to storage
   *
   * @param ref
   */
  async unregister(ref: IStorageRef | string) {
    return this.storage.unregister(ref);
  }
}
