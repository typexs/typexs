/**
 * Http Get Options
 */
import {IHttpRequestOptions} from './IHttpRequestOptions';

export interface IGetOptions extends IHttpRequestOptions {

  /**
   * URL of request
   */
  url: string;

  /**
   * Enable logging
   */
  logging?: boolean;
}
