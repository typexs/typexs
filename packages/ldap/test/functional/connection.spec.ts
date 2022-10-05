import { cloneDeep, defaultsDeep } from 'lodash';
import { suite, test } from '@testdeck/mocha';
import { expect } from 'chai';
import { Bootstrap, Injector } from '@typexs/base';
import { TestHelper } from '@typexs/testing';
import { CONFIG_01 } from './instances/configuration_01';
import { LdapStorageRef } from '../../src/lib/storage/LdapStorageRef';
import { LDAP_CONFIG, LDAP_FAIL_CONFIG, LDAP_WRONG_CONFIG } from './config';


let bootstrap: Bootstrap = null;

@suite('functional/ldap/connection')
class TypexsLdapConnection {


  async before() {
    Bootstrap.reset();
  }

  async after() {
    if (bootstrap) {
      await bootstrap.shutdown();
      // await TestHelper.wait(50);
    }
    Bootstrap.reset();
  }


  @test
  async 'ldap connection can be established'() {
    bootstrap = await TestHelper.bootstrap(defaultsDeep(cloneDeep(CONFIG_01), {
      storage: {
        ldap: LDAP_CONFIG
      }
    }));
    const ref = Injector.get<LdapStorageRef>('storage.ldap');
    const connection = await ref.connect();
    expect(connection.isOpened()).to.be.true;
    expect(connection.isBound()).to.be.true;
    await connection.close();
    expect(connection.isOpened()).to.be.false;
  }

  @test
  async 'ldap connection fail to estabilsh cause server not reachable'() {
    bootstrap = await TestHelper.bootstrap(defaultsDeep(cloneDeep(CONFIG_01), {
      storage: {
        ldap: LDAP_WRONG_CONFIG
      }
    }));
    const ref = Injector.get<LdapStorageRef>('storage.ldap');
    const connection = await ref.connect();
    expect(connection.isOpened()).to.be.false;
    expect(connection.hasError()).to.be.true;
    expect(connection.getLastError().message).to.be.eq('connectRefused: connect ECONNREFUSED 127.0.32.32:389');
  }

  @test
  async 'ldap connection fail to estabilsh cause wrong login data'() {
    bootstrap = await TestHelper.bootstrap(defaultsDeep(cloneDeep(CONFIG_01), {
      storage: {
        ldap: LDAP_FAIL_CONFIG
      }
    }));
    const ref = Injector.get<LdapStorageRef>('storage.ldap');
    const connection = await ref.connect();
    expect(connection.isOpened()).to.be.false;
    expect(connection.hasError()).to.be.true;
    expect(connection.getLastError().message).to.be.eq('Invalid Credentials');
  }




}
