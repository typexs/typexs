import * as _ from 'lodash';
import { suite, test } from '@testdeck/mocha';
import { expect } from 'chai';
import { Bootstrap, Injector, Log, Storage } from '@typexs/base';
import * as path from 'path';
import { C_LDAP } from '../../src/lib/Constants';
import { TestHelper } from '@typexs/testing';
import { ILdapStorageRefOptions } from '../../src/lib/storage/ILdapStorageRefOptions';
import { CONFIG_01 } from './instances/configuration_01';
import { LdapStorageRef } from '../../src/lib/storage/LdapStorageRef';
import { cloneDeep, defaultsDeep } from 'lodash';
import { LDAP_CONFIG, LDAP_FAIL_CONFIG, LDAP_WRONG_CONFIG } from './config';
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
    await beforeCall(defaultsDeep(cloneDeep(CONFIG_01), {
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
    await beforeCall(defaultsDeep(cloneDeep(CONFIG_01), {
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
    await beforeCall(defaultsDeep(cloneDeep(CONFIG_01), {
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
