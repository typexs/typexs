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
   * Tags describing/classifing the binding
   */
  tags?: string[];

  /**
   * Weight if multiple entries for same context use weight for overriding
   */
  weight?: number;

  /**
   * Freestyle key: value use
   */
  [k: string]: any;
}
