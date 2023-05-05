import { IStorageLoaderApi } from './IStorageLoaderApi';
import { IStorageRef } from '@typexs/base';
import { StorageSetting } from '../entities/storage/StorageSetting';

/**
 * API for storage loader
 */
export class StorageLoaderApi implements IStorageLoaderApi {

  /**
   * Called after a storage ref is registered
   *
   * @param settings
   */
  afterRegister?(storageRef: IStorageRef, settings?: StorageSetting) {
  }

  /**
   * Called before a storage ref is unregistered
   *
   * @param settings
   */
  beforeUnregister?(storageRef: IStorageRef, settings?: StorageSetting) {
  }

}
