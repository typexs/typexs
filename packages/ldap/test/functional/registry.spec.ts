import { suite, test } from '@testdeck/mocha';
import { expect } from 'chai';
import { C_LDAP } from '../../src/lib/Constants';
import { RegistryFactory } from '@allgemein/schema-api';
import { LdapEntityRegistry } from '../../src/lib/registry/LdapEntityRegistry';
import { LdapGenericObject } from '../../src/lib/registry/LdapGenericObject';


@suite('functional/ldap/registry')
class TypexsLdapRegistry {


  static async before() {
    RegistryFactory.register(C_LDAP, LdapEntityRegistry);
    RegistryFactory.register(/^ldap\..*/, LdapEntityRegistry);
  }


  static async after() {
    RegistryFactory.remove(C_LDAP);
    RegistryFactory.remove([C_LDAP, 'test'].join('.'));
  }


  @test
  async 'check registry is correctly registered'() {
    const reg = RegistryFactory.get([C_LDAP, 'test'].join('.'));
    expect(reg instanceof LdapEntityRegistry).to.be.true;
  }


  @test
  async 'check if default object is loaded'() {
    const reg = RegistryFactory.get([C_LDAP, 'test'].join('.'));
    expect(reg.getEntityRefs()).to.have.length(1);

    const entry = reg.getEntityRefs().find(x => x.name === LdapGenericObject.name);
    expect(entry.name).to.be.eq(LdapGenericObject.name);
  }

}
