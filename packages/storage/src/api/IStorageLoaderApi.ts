import { IStorageRef } from '@typexs/base';
import { StorageSetting } from '../entities/storage/StorageSetting';

/**
 * Interface declaration
 */
export interface IStorageLoaderApi {

  /**
   * Called after a storage ref is registered
   *
   * @param settings
   */
  afterRegister?(storageRef: IStorageRef, settings?: StorageSetting): void;

  /**
   * Called before a storage ref is unregistered
   *
   * @param settings
   */
  beforeUnregister?(storageRef: IStorageRef, settings?: StorageSetting): void;

}
