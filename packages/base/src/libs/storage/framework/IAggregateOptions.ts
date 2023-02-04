import { IRequestOptions } from './IRequestOptions';

export interface IAggregateOptions extends IRequestOptions  {

  /**
   * result limit
   */
  limit?: number;


  /**
   * result offset
   */
  offset?: number;

  /**
   * result sort definition
   */
  sort?: { [key: string]: 'asc' | 'desc' };

  /**
   * disable the count query
   */
  disableCount?: boolean;


  /**
   * enable auto parse of numbers
   */
  autoParseNumbers?: boolean;
}
