import { IStorage } from '@typexs/base/libs/storage/IStorage';
import { IStorageRef, RuntimeLoader } from '@typexs/base';
import { RegistryFactory } from '@allgemein/schema-api';
import { C_LDAP } from '../../../lib/Constants';
import { LdapEntityRegistry } from '../../../lib/registry/LdapEntityRegistry';
import { LdapStorageRef } from '../../../lib/storage/LdapStorageRef';
import { ILdapStorageRefOptions } from '../../../lib/storage/ILdapStorageRefOptions';
import { keys } from 'lodash';
import { C_SEARCH_INDEX } from '@typexs/search/lib/Constants';


export class LdapStorage implements IStorage {


  async create(name: string, options: ILdapStorageRefOptions): Promise<IStorageRef> {
    if (!options.url) {
      options.url =
        options.protocol ? options.protocol : 'ldap' + '://' +
        options.host ? options.host : 'localhost' + ':' +
        options.port ? options.port + '' : 'localhost' + '';
    }

    if (!(options.bindDN || options.bindCredentials)) {
      throw new Error('missing bind dn or credentials');
    }
    const ref = new LdapStorageRef(options);
    ref.prepare();
    return ref;
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
    return true;
  }

  shutdown() {
    const registryKeys = keys(RegistryFactory.$handles).filter(x => x.startsWith(C_LDAP));
    registryKeys.map(x => RegistryFactory.get(x).reset());
  }

}
