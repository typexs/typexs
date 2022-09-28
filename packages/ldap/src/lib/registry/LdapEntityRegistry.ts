import { DefaultNamespacedRegistry } from '@allgemein/schema-api';

export class LdapEntityRegistry extends DefaultNamespacedRegistry {

  // eslint-disable-next-line no-use-before-define
  private static $self: LdapEntityRegistry;

  // lookupRegistry: LookupRegistry;


  // static $() {
  //   if (!this.$self) {
  //     this.$self = RegistryFactory.get(C_LDAP) as LdapEntityRegistry;
  //   }
  //   return this.$self;
  // }

}
