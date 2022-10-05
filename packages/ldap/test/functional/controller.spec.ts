import { cloneDeep, defaultsDeep } from 'lodash';
import { suite, test } from '@testdeck/mocha';
import { expect } from 'chai';
import { Bootstrap, Injector, Log, XS_P_$COUNT, XS_P_$LIMIT, XS_P_$OFFSET } from '@typexs/base';
import { CONFIG_01 } from './instances/configuration_01';
import { LdapStorageRef } from '../../src/lib/storage/LdapStorageRef';
import { LDAP_CONFIG } from './config';
import { NoSuchObjectError } from 'ldapjs';
import { TestHelper } from '@typexs/testing';
import { LdapGenericObject } from '../../src/lib/registry/LdapGenericObject';


let bootstrap: Bootstrap = null;


@suite('functional/ldap/controller')
class TypexsLdapController {


  static async before() {
    Bootstrap.reset();
    bootstrap = await TestHelper.bootstrap(defaultsDeep(cloneDeep(CONFIG_01), {
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
  async 'ldap conntroller find by raw query'() {
    const ref = Injector.get<LdapStorageRef>('storage.ldap');
    const controller = ref.getController();
    const entries = await controller.find(LdapGenericObject, {
      scope: 'sub',
      filter: 'uid=*',
      baseDn: 'cn=example,dc=org'
    }, { rawQuery: true });
    expect(entries).to.have.length.gt(1);
    expect(entries[XS_P_$COUNT]).to.be.gt(1);
    expect(entries[XS_P_$LIMIT]).to.be.gt(1);
    expect(entries[XS_P_$OFFSET]).to.be.eq(null);

  }

}
