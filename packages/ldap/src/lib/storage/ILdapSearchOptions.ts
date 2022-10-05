import { SearchOptions } from 'ldapjs';

export interface ILdapSearchOptions extends SearchOptions {
  cookie?: any;
}
