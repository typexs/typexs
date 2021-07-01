import {IStorageOptions} from '@typexs/base';

export interface IIndexStorageRefOptions extends IStorageOptions {

  /**
   * The framework will be Elastic
   */
  framework: 'index';


  /**
   * The sub type will be Elastic
   */
  type: string;




}
