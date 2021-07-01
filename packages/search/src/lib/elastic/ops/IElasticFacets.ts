export interface IElasticFacet {
  type: 'range' | 'value';
  name?: string;
}

export interface IElasticValueFacet extends IElasticFacet {
  type: 'value';
  size?: number;
  sort?: any;
}

export interface IElasticRangeFacet extends IElasticFacet {
  type: 'range';
  ranges: {from: any, to: any}[];
}

export interface IElasticFacets {
  [k: string]: (IElasticRangeFacet | IElasticValueFacet)[];
}
