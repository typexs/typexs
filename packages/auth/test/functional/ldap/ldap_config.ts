import { ILdapAuthOptions } from '../../../src/adapters/auth/ldap/ILdapAuthOptions';
import { ldap_host, ldap_port } from '../config';

export const LDAP_CONFIG: ILdapAuthOptions = <ILdapAuthOptions>{
  type: 'ldap',
  url: 'ldap://' + ldap_host + ':' + ldap_port,
  bindDN: 'cn=admin,dc=example,dc=org',
  bindCredentials: 'admin',
  searchBase: 'dc=example,dc=org'
  //timeout: 2000,
  //connectTimeout: 30000
};
