import { IActivator } from '@typexs/base';

/**
 * Default storage at @typexs/base should already be loaded, so now we can attached
 * storage sources declared in the declared backend ;)
 *
 * Load storage configurations from StorageRef
 */
export class Activator implements IActivator {

  async startup() {

  }

}
