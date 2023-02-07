import { ICollection, IStorageRefOptions } from '@typexs/base';

/**
 * Interface declaration
 */
export interface ISystemStorageInfo {


  /**
   * Gives the possiblity to append/change/remove settings in the storage info objects
   * before there are delivered to the frontend
   * @param options
   */
  prepareStorageInfo?(options: IStorageRefOptions[]): void;


  /**
   * Gives the possiblity to append/change/remove settings in the storage entities object
   * before they are delivered to the frontend
   *
   * @param config
   */
  prepareStorageEntities?(tables: ICollection[]): void;


}
