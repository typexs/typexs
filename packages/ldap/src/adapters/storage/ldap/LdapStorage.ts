import { IStorage } from '@typexs/base/libs/storage/IStorage';
import { IStorageRef, RuntimeLoader } from '@typexs/base';
import { RegistryFactory } from '@allgemein/schema-api';
import { ILdapStorageOptions } from '../../../lib/storage/ILdapStorageOptions';
import { C_LDAP } from '../../../lib/Constants';
import { LdapEntityRegistry } from '../../../lib/registry/LdapEntityRegistry';


export class LdapStorage implements IStorage {


  async create(name: string, options: ILdapStorageOptions): Promise<IStorageRef> {
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
    return null;
  }

  /**
   * Name of this framework type
   */
  getType(): string {
    return C_LDAP;
  }

  async prepare(loader: RuntimeLoader) {
    RegistryFactory.register(C_LDAP, LdapEntityRegistry);
    RegistryFactory.register(/^ldap\..*/, LdapEntityRegistry);

    // const classes = await loader.getClasses(K_CLS_STORAGE_INDEX_TYPES);
    // for (const cls of classes) {
    //   const idxType = Reflect.construct(cls, []);
    //   this.types.push(idxType);
    // }

    return true;
  }

  shutdown() {
    RegistryFactory.get(C_LDAP).reset();
  }

}
