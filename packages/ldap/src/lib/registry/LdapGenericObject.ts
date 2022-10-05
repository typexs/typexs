import { Entity, Property } from '@allgemein/schema-api';

@Entity()
export class LdapGenericObject {

  @Property()
  dn: string;

}
