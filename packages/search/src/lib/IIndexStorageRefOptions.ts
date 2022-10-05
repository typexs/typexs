import {IStorageRefOptions} from '@typexs/base';

export interface IIndexStorageRefOptions extends IStorageRefOptions {

  /**
   * The framework will be Elastic
   */
  framework: 'search-index';


  /**
   * The sub type will be Elastic
   */
  type: string;




}
