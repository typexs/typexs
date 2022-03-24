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

export interface IComponentBinding {
  /**
   * Name of the component type
   */
  key: string;

  /**
   * extra
   */
  extra?: IExtraBindingInfo;

  /**
   * class
   */
  handle?: Function | string | RegExp;

  /**
   * component class
   */
  component?: Function;
}
