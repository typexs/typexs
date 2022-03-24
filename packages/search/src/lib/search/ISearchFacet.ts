/**
 * Specifices the defined facet
 */
export interface ISearchFacet {
  /**
   * Name for the facet
   */
  name: string;

  /**
   * Field containing values
   */
  field: string;

  /**
   * Type of the facet
   * - value - quantity of field values
   * - range - values spectrum of field values
   */
  type: 'value' | 'range';

  /**
   * Results for the facet
   */
  results?: any;
}
