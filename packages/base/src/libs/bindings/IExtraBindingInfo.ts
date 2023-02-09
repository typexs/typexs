export interface IExtraBindingInfo {
  /**
   * Context of the binding
   */
  context?: string;

  /**
   * Label
   */
  label?: string;

  /**
   * Do not show as view mode
   */
  hide?: boolean;

  /**
   * Component allows creation or editing of instance data
   */
  editable?: boolean;
  // /**
  //  * Tags describing/classifing the binding
  //  */
  // tags?: string[];

  /**
   * Weight if multiple entries for same context use weight for overriding
   */
  weight?: number;


  /**
   * Conditions for component selection
   *
   * @param object
   */
  condition?: (object: any) => boolean;


  /**
   * Freestyle key: value use
   */
  [k: string]: any;
}
