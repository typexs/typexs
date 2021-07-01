import {IDeleteOptions} from '@typexs/base/libs/storage/framework/IDeleteOptions';
import {IElasticOptions} from './IElasticOptions';

export interface IElasticDeleteOptions extends IDeleteOptions, IElasticOptions {
  /**
   * Refresh index after processing
   */
  refresh?: boolean;

  /**
   * Allow passing original elastic DSL query and ignore interpretion of mango query
   */
  rawQuery?: boolean;

}
