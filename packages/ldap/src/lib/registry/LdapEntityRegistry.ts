import { DefaultNamespacedRegistry } from '@allgemein/schema-api';
import { LdapGenericObject } from './LdapGenericObject';

export class LdapEntityRegistry extends DefaultNamespacedRegistry {

  prepare() {
    this.getEntityRefFor(LdapGenericObject);
  }

}
