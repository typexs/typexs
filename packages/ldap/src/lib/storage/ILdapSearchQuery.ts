export interface ILdapSearchQuery {
  scope?: 'base' | 'one' | 'sub' | undefined;
  filter?: string | undefined;
  attributes?: string | string[] | undefined;
  searchDn?: string;
}
