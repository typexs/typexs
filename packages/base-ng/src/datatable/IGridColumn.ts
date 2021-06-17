import {JS_DATA_TYPES} from '@allgemein/schema-api';

export interface IGridColumn {
  /**
   * Header name of column
   */
  label: string;

  /**
   * Key for the value of the entry
   */
  field: string;

  /**
   * Filter type
   */
  filterType?: 'contains' | 'equal' | 'suggest' | 'range';

  /**
   * Filter data type
   */
  filterDataType?: JS_DATA_TYPES;

  /**
   * Retrieve value for a property of a entity
   */
  valueHandler?: (x: any) => any;

  /**
   * Check if value is empty
   */
  emptyHandler?: (x: any) => boolean;


  /**
   * Sorting
   */
  sorting?: boolean;

  /**
   * Filtering
   */
  filter?: boolean;

  /**
   * Subheader
   */
  children?: IGridColumn[];


  /**
   * Component class reference name which renders cell data
   */
  cellValueRenderer?: string;
}
