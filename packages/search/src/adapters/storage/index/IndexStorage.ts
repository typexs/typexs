import { IStorage } from '@typexs/base/libs/storage/IStorage';
import { IStorageRef, RuntimeLoader } from '@typexs/base';
import { C_SEARCH_INDEX, K_CLS_STORAGE_INDEX_TYPES } from '../../../lib/Constants';
import { IIndexStorageRefOptions } from '../../../lib/IIndexStorageRefOptions';
import { IIndexType } from '../../../lib/IIndexType';
import { IndexEntityRegistry } from '../../../lib/registry/IndexEntityRegistry';
import { RegistryFactory } from '@allgemein/schema-api';
import { keys } from 'lodash';


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
    return C_SEARCH_INDEX;
  }

  async prepare(loader: RuntimeLoader) {
    RegistryFactory.register(C_SEARCH_INDEX, IndexEntityRegistry);
    RegistryFactory.register(/^search-index\..*/, IndexEntityRegistry);
    const classes = await loader.getClasses(K_CLS_STORAGE_INDEX_TYPES);
    for (const cls of classes) {
      const idxType = Reflect.construct(cls, []);
      this.types.push(idxType);
    }
    return true;
  }

  shutdown() {
    // RegistryFactory.get(C_SEARCH_INDEX).reset();
    // TODO create cleanup method in registry
    const registryKeys = keys(RegistryFactory.$handles).filter(x => x.startsWith(C_SEARCH_INDEX));
    registryKeys.map(x => RegistryFactory.get(x).reset());
  }

}
