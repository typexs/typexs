import { IActivator, Injector, Config } from '@typexs/base';
import { IStorageLoaderOptions, StorageLoader } from './lib/StorageLoader';

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

}
