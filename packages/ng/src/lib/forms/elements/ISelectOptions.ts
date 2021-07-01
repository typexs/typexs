import { ISelectOption } from './ISelectOption';

export interface ISelectOptions {

  /**
   * Label for this selection field
   */
  label?: string;

  /**
   * Type of selection options delivery
   * - Array of values
   * - Array of select options
   * - Function returning array of select options or string values
   * - string declaring field name where an array of select options or string values is present
   */
  enum?: string | Function | string[] | ISelectOption[];

}

