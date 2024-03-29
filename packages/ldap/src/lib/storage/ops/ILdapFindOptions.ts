import { IFindOptions, ISaveOptions } from '@typexs/base';
import { ILdapOptions } from './ILdapOptions';

export interface ILdapFindOptions extends IFindOptions, ILdapOptions {

  /**
   * Execute raw ldap query
   */
  rawQuery?: boolean;
}
