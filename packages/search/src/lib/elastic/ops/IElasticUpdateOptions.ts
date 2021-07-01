import {IUpdateOptions} from '@typexs/base/libs/storage/framework/IUpdateOptions';
import {IElasticOptions} from './IElasticOptions';

export interface IElasticUpdateOptions extends IUpdateOptions, IElasticOptions {

  /**
   * Allow passing original elastic DSL query and ignore interpretion of mango query
   */
  rawQuery?: boolean;


}


