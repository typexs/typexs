import { IExtraBindingInfo } from './IExtraBindingInfo';


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
