import { UseAPI } from '@typexs/base/decorators/UseAPI';
import { EntityControllerApi, IEntityControllerApi, Inject, Log } from '@typexs/base';
import { ISaveOp } from '@typexs/base/libs/storage/framework/ISaveOp';
import { IDeleteOp } from '@typexs/base/libs/storage/framework/IDeleteOp';
import { isArray, isEmpty } from 'lodash';
import { StorageLoader } from '../lib/StorageLoader';
import { StorageSetting } from '../entities/storage/StorageSetting';

@UseAPI(EntityControllerApi)
export class ExtendEntityControllerApi implements IEntityControllerApi {
  // check if worker is online, pass objects

  @Inject(() => StorageLoader)
  loader: StorageLoader;




  isActive() {
    if (this.loader && this.loader.isActive()) {
      return this.loader.getOptions().autoload;
    }
    return false;
  }


  doAfterSave<T>(object: T[] | T, error: Error, op: ISaveOp<T>) {
    if (!(this.isActive())) {
      return;
    }
    const entries = isArray(object) ? object : [object];
    const settings = entries.filter(x => x instanceof StorageSetting && x.active) as any as StorageSetting[];
    if (!isEmpty(settings)) {
      this.loader.loadByStorageSettings(settings).catch(x => Log.error(x));
    }
  }


  doBeforeRemove<T>(op: IDeleteOp<T>) {
    if (!this.isActive()) {
      return;
    }
  }
}
