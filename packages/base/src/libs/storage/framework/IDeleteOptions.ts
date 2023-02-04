// TODO

import { IRequestOptions } from './IRequestOptions';

export interface IDeleteOptions extends IRequestOptions {
  limit?: number;
  offset?: number;

  /**
   * Disable the usage of transactions
   */
  noTransaction?: boolean;
}
