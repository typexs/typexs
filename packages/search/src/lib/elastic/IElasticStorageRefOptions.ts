import {IIndexStorageRefOptions} from '../IIndexStorageRefOptions';
import {IEntityRef} from '@allgemein/schema-api';


export interface IElasticIndexOptions {
  /**
   * Define name/alias for the index (if not given, name will be generated)
   */
  index?: string;

  /**
   * Default is true, each found text field will copy data to _all field
   */
  autoAppendAllField?: boolean;

  /**
   * Entities registered to the index
   *
   * todo conditions for filtering entities
   */
  entities: (string | IEntityRef | { entityName: string; registry: string })[];
}


export interface IElasticStorageRefOptions extends IIndexStorageRefOptions {

  /**
   * IP or Hostname (default is localhost)
   */
  host?: string;

  /**
   * Port (default is 9200)
   */
  port?: number;

  /**
   * Is ssl connection for https protocol or http
   */
  ssl?: boolean;

  /**
   * Version of Api for ES
   */
  apiVersion?: string;

  /**
   * The sub type will be Elastic
   */
  type: 'elastic';

  /**
   * default Prefix for index
   */
  prefixEntity?: string;


  /**
   * Declare for with entities should be index support given
   */
  indexTypes?: IElasticIndexOptions[];


}
