export interface IElasticFieldDef {
  /**
   * JS data type
   */
  type: string;

  /**
   * Elastic search types
   */
  esType: string;

  /**
   * Property name
   */
  name: string;

  /**
   * Name of class with this property
   */
  className: string;

  /**
   * Indexname where data of this kind is saved
   */
  indexName?: string;

  /**
   * Type name in index where data is saved
   */
  typeName?: string;
}
