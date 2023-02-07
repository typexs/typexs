import { Inject } from '@typexs/base';
import { StorageSetting } from '../entities/storage/StorageSetting';
import { StorageLoader } from '../lib/StorageLoader';

/**
 * Prerequierment is that TestStorageSettings passed successfully
 */
export class ActivateStorageSetting {

  @Inject(() => StorageLoader)
  loader: StorageLoader;

  settings: StorageSetting;

  error: Error;

  success: boolean;

  async doCall(settings: StorageSetting) {
    this.settings = settings;
    await this.exec();
    return { success: this.success, error: this.error };
  }

  async exec() {
    this.success = false;
    try {
      this.settings.active = true;
      await this.loader.getStorageRef().getController().save(this.settings);
      if (this.loader.isLoaded(this.settings.getId())) {
        await this.loader.unregister(this.settings.getId());
      }
      await this.loader.loadByStorageSetting(this.settings);
      this.success = true;
    } catch (e) {
      this.error = e;
    }

  }


}
