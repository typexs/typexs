import {ClassType} from '@allgemein/schema-api';
import {IStorageRef} from '@typexs/base';

export interface IIndexType {

  /**
   * Return name of index type
   */
  getType(): string;

  /**
   * Return storage ref class for handling this index type
   */
  getStorageRefClass(): ClassType<IStorageRef>;

}
