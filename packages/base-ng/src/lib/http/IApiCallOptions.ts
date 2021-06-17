/**
 *
 */
export interface IApiCallOptions {
  /**
   * URL parameter for the api call with must be setted and known be the caller
   */
  params?: { [key: string]: any };
  /**
   * Content for the api, will be passed in the body part
   */
  content?: any;
  /**
   * Additional query parameter for the call
   */
  query?: any;
  /**
   * Additional query parameter for the call
   */
  handle?: (err: Error, data: any) => void;
  /**
   * Additional options for request
   */
  options?: any;
  /**
   * Surpress errors which will be thrown by handleRequest (default: false)
   */
  surpressErrors?: boolean;
}
