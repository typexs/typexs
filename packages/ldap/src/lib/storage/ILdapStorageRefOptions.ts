import { IStorageRefOptions } from '@typexs/base';
import { ClientOptions } from '../client/LdapOptions';

export interface ILdapStorageRefOptions extends IStorageRefOptions, ClientOptions {

  /**
   * Define the protocol
   */
  protocol?: 'ldap' | 'ldaps';

  /**
   * Define the hostname
   */
  host?: string;

  /**
   * Define the port
   */
  port?: number;


  /**
   * Define baseDN for base entry
   */
  baseDN?: string;
}
