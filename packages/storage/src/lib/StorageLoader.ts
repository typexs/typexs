import { C_DEFAULT } from '@allgemein/base';
import { Inject, IStorageRef, RuntimeLoader, Storage } from '@typexs/base';
import { StorageSetting } from '../entities/StorageSetting';

export class StorageLoader {


  @Inject(Storage.NAME)
  storage: Storage;

  @Inject(RuntimeLoader.NAME)
  runtimeLoader: RuntimeLoader;

  storageRef: IStorageRef;

  async initialize() {
    this.storageRef = this.storage.forClass(StorageSetting);
    const settings = await this.storageRef.getController().find(StorageSetting, null, { limit: 0 });
    // load schema ....

    for (const setting of settings) {
      await this.load(setting.name, setting);
    }

  }

  async load(name: string, setting: StorageSetting) {
    const ref = this.storage.get(name);
    if (ref) {
      throw new Error(`Storage reference with this name ${name} already exists.`);
    }
    return this.storage.registerStorageRef(name, setting, this.runtimeLoader);
  }


}
