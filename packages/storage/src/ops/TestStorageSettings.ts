import { Inject } from '@typexs/base';
import { StorageSetting } from '../entities/storage/StorageSetting';
import { StorageLoader } from '../lib/StorageLoader';

export class TestStorageSettings {

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
      // TODO check if loaded
      if(!this.loader.isLoaded(this.settings.name)){
        const ref = await this.loader.loadByStorageSetting(this.settings);
        const c = await ref.connect();
        if (c['ping']) {
          this.success = await c.ping();
        } else {
          this.success = true;
        }
        await c.close();
        await this.loader.unregister(ref, this.settings);
      }
    } catch (e) {
      this.error = e;
    }

  }


}
