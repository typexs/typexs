import { Inject } from '@typexs/base';
import { StorageSetting } from '../entities/storage/StorageSetting';
import { StorageLoader } from '../lib/StorageLoader';

/**
 * Prerequierment is that TestStorageSettings passed successfully
 */
export class ActivateStorageSetting {

  @Inject(() => StorageLoader)
  loader: StorageLoader;



  /**
   * @Incoming
   * Define if activation should happen or deactivation
   */
  activate: boolean = true;

  /**
   * @Incoming
   * StorageSetting to activate or deactivate
   */
  settings: StorageSetting;

  /**
   * @Outgoing
   * Error message thrown in the process
   */
  error: Error;

  /**
   * @Outgoing
   * Status of the process
   */
  success: boolean;

  async doCall(settings: StorageSetting, activate: boolean = true) {
    this.activate = activate;
    this.settings = settings;
    await this.exec();
    return { success: this.success, error: this.error };
  }

  async exec() {
    this.success = false;
    try {
      this.settings.active = this.activate;
      await this.loader.getStorageRef().getController().save(this.settings);
      if (this.activate) {
        if (this.loader.isLoaded(this.settings.name)) {
          await this.loader.unregister(this.settings.name, this.settings);
        }
        await this.loader.loadByStorageSetting(this.settings);
      } else {
        if (this.loader.isLoaded(this.settings.name)) {
          await this.loader.unregister(this.settings.name, this.settings);
        }
      }
      this.success = true;
    } catch (e) {
      this.error = e;
    }
  }


}
