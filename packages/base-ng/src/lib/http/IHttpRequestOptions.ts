import {HttpHeaders, HttpParams} from '@angular/common/http';

/**
 * Generic Http Request Options
 */
export interface IHttpRequestOptions {

  /**
   * URL of request
   */
  url: string;

  /**
   * Enable logging
   */
  logging?: boolean;

  /**
   * Body for the request
   */
  body?: any;


  /**
   * Passed function to be processed on request outcome (succes, error)
   */
  callback?: (error: Error, data: any) => void;

  /**
   * ============================
   *
   *  Angular HTTP Parameter
   *
   * ============================
   */

  headers?: HttpHeaders | {
    [header: string]: string | string[];
  };

  observe?: 'response';

  params?: HttpParams | {
    [param: string]: string | string[];
  };

  reportProgress?: boolean;

  responseType?: 'json';

  withCredentials?: boolean;
}
