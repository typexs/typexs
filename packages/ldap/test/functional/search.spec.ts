import { cloneDeep, defaultsDeep } from 'lodash';
import { suite, test } from '@testdeck/mocha';
import { expect } from 'chai';
import { Bootstrap, Injector, Log } from '@typexs/base';
import { CONFIG_01 } from './instances/configuration_01';
import { LdapStorageRef } from '../../src/lib/storage/LdapStorageRef';
import { LDAP_CONFIG } from './config';
import { NoSuchObjectError } from 'ldapjs';


let bootstrap: Bootstrap = null;

const beforeCall = async function(cfg: any) {
  bootstrap = Bootstrap
    .setConfigSources([{ type: 'system' }])
    .configure(cfg);

  bootstrap.activateErrorHandling();
  bootstrap.activateLogger();
  await bootstrap.prepareRuntime();
  await bootstrap.activateStorage();
  await bootstrap.startup();

};

@suite('functional/ldap/search')
class TypexsLdapSearch {


  static async before() {
    Bootstrap.reset();
    await beforeCall(defaultsDeep(cloneDeep(CONFIG_01), {
      storage: {
        ldap: LDAP_CONFIG
      }
    }));
  }

  static async after() {
    if (bootstrap) {
      await bootstrap.shutdown();
      // await TestHelper.wait(50);
    }
    Bootstrap.reset();
  }


  @test
  async 'ldap connection read schema'() {
    const ref = Injector.get<LdapStorageRef>('storage.ldap');
    const connection = await ref.connect();
    let entries: any[] = [];
    try {
      entries = await connection.search(
        'cn=subschema',
        {
          scope: 'base'
        }
      );
    } catch (e) {
      if (e instanceof NoSuchObjectError) {
        Log.error(e);
      } else {
        Log.error(e);
      }
    }

    expect(entries).to.have.length(1);
    await connection.close();
  }

  /**
   * ldapsearch -H ldap://localhost:389 -s sub -b dc=example,dc=org -D cn=admin,dc=example,dc=org -w admin uid=*
   */
  @test
  async 'ldap connection read some user'() {
    await beforeCall(defaultsDeep(cloneDeep(CONFIG_01), {
      storage: {
        ldap: LDAP_CONFIG
      }
    }));
    const ref = Injector.get<LdapStorageRef>('storage.ldap');
    const connection = await ref.connect();
    let entries: any[] = [];
    try {
      entries = await connection.search(
        'dc=example,dc=org',
        {
          scope: 'sub',
          filter: 'uid=*'
        }
      );
    } catch (e) {
      if (e instanceof NoSuchObjectError) {
        Log.error(e);
      } else {
        Log.error(e);
      }
    }
    expect(entries).to.have.length.gte(5);
    await connection.close();
  }


  @test
  async 'ldap connection size limit'() {
    await beforeCall(defaultsDeep(cloneDeep(CONFIG_01), {
      storage: {
        ldap: LDAP_CONFIG
      }
    }));
    const ref = Injector.get<LdapStorageRef>('storage.ldap');
    const connection = await ref.connect();
    let entries: any[] = [];
    try {
      entries = await connection.search(
        'dc=example,dc=org',
        {
          scope: 'sub',
          filter: 'uid=*',
          // paged: true,
          sizeLimit: 3
        }
      );
    } catch (e) {
      if (e instanceof NoSuchObjectError) {
        Log.error(e);
      } else {
        Log.error(e);
      }
    }
    // console.log(entries);
    expect(entries).to.have.length(3);
    await connection.close();
  }

}
