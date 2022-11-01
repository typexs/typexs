import { get } from 'lodash';
import { ILdapAuthOptions } from '@typexs/auth/adapters/auth/ldap/ILdapAuthOptions';
import { ILdapStorageRefOptions } from '../../src/lib/storage/ILdapStorageRefOptions';
import { C_LDAP } from '../../src/lib/Constants';

export const ldap_host = get(process.env, 'LDAP_HOST', 'localhost');
export const ldap_port = get(process.env, 'LDAP_PORT', 389);
export const ldaps_port = get(process.env, 'LDAPS_PORT', 689);


export const LDAP_CONFIG: ILdapStorageRefOptions = <ILdapStorageRefOptions>{
  framework: C_LDAP,
  url: 'ldap://' + ldap_host + ':' + ldap_port,
  bindDN: 'cn=admin,dc=example,dc=org',
  bindCredentials: 'admin',
  baseDN: 'dc=example,dc=org'
};

export const LDAP_FAIL_CONFIG: ILdapStorageRefOptions = <ILdapStorageRefOptions>{
  framework: C_LDAP,
  url: 'ldap://' + ldap_host + ':' + ldap_port,
  bindDN: 'cn=adminus,dc=example,dc=org',
  bindCredentials: 'admin',
  baseDN: 'dc=example,dc=org'
};

export const LDAP_WRONG_CONFIG: ILdapStorageRefOptions = <ILdapStorageRefOptions>{
  type: 'ldap',
  url: 'ldap://127.0.32.32:' + ldap_port,
  bindDN: 'cn=adminus,dc=example,dc=org',
  bindCredentials: 'admin',
  baseDN: 'dc=example,dc=org'
};
