import { IActivator, Injector } from '@typexs/base';
import { Inject } from '@angular/core';
import { StorageLoader } from './lib/StorageLoader';

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
      await loader.initialize();
    }
  }

}
