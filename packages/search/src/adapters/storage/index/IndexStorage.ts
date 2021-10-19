import { IStorage } from '@typexs/base/libs/storage/IStorage';
import { IStorageRef, RuntimeLoader } from '@typexs/base';
import { K_CLS_STORAGE_INDEX_TYPES } from '../../../lib/Constants';
import { IIndexStorageRefOptions } from '../../../lib/IIndexStorageRefOptions';
import { IIndexType } from '../../../lib/IIndexType';
import { IndexEntityRegistry } from '../../../lib/registry/IndexEntityRegistry';


export class IndexStorage implements IStorage {

  extend: any;

  types: IIndexType[] = [];

  async create(name: string, options: IIndexStorageRefOptions): Promise<IStorageRef> {
    if (!options.type) {
      throw new Error('not type is given');
    }
    const type = this.types.find(x => x.getType() === options.type);
    if (!options.type) {
      throw new Error('not type is given');
    }

    const ref = Reflect.construct(type.getStorageRefClass(), [options]);
    await ref.prepare();
    return ref;
  }

  /**
   * Name of this framework type
   */
  getType(): string {
    return 'index';
  }

  async prepare(loader: RuntimeLoader) {
    const classes = await loader.getClasses(K_CLS_STORAGE_INDEX_TYPES);
    for (const cls of classes) {
      const idxType = Reflect.construct(cls, []);
      this.types.push(idxType);
    }
    return true;
  }

  shutdown() {
    IndexEntityRegistry.reset();
  }

}
