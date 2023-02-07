import { ICollection, IStorageRefOptions } from '@typexs/base';
import { ISystemStorageInfo } from './ISystemStorageInfo';


/**
 * Abstract declaration for the api used by invoker
 */
export class SystemStorageInfoApi implements ISystemStorageInfo {

  /**
   * Return key list which should be removed before configuration
   * delivered by controller
   */
  filterConfigKeys(): string[] {
    return null;
  }


  /**
   * Gives the possibility to append/change/remove settings in the storage info objects
   * before there are delivered to the frontend
   * @param options
   */
  prepareStorageInfo(options: IStorageRefOptions[]) {
  }

  /**
   * Gives the possibility to append/change/remove settings in the storage entities object
   * before they are delivered to the frontend
   *
   * @param config
   */
  prepareStorageEntities(tables: ICollection[]): void {
  }


}
