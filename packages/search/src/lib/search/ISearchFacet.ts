export interface ISearchFacet {
  name: string;
  type: 'value' | 'range';
  field: string;
  results?: any;
}
