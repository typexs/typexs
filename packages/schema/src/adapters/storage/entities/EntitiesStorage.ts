import { IStorage } from '@typexs/base/libs/storage/IStorage';
import { IStorageRef, RuntimeLoader } from '@typexs/base';
import { RegistryFactory } from '@allgemein/schema-api';
import { NAMESPACE_BUILT_ENTITY } from '../../../libs/Constants';
import { EntityRegistry } from '../../../libs/EntityRegistry';


export class EntitiesStorage implements IStorage {

  extend: any;


  async create(name: string, options: any): Promise<IStorageRef> {
    // if (!options.type) {
    //   throw new Error('not type is given');
    // }
    // const type = this.types.find(x => x.getType() === options.type);
    // if (!options.type) {
    //   throw new Error('not type is given');
    // }
    //
    // const ref = Reflect.construct(type.getStorageRefClass(), [options]);
    // await ref.prepare();
    // return ref;
    throw new Error('not implemented');
  }

  /**
   * Name of this framework type
   */
  getType(): string {
    return 'entities';
  }

  async prepare(loader: RuntimeLoader) {
    RegistryFactory.register(NAMESPACE_BUILT_ENTITY, EntityRegistry);
    RegistryFactory.register(new RegExp('^' + NAMESPACE_BUILT_ENTITY + '\.'), EntityRegistry);
    RegistryFactory.get(NAMESPACE_BUILT_ENTITY);
    return true;
  }

  shutdown() {
  }

}
