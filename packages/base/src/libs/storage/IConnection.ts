import { IObjectHandle } from './framework/IObjectHandle';
import { EntityType } from './framework/Constants';

/**
 * Interface for relevant connection methods
 */
export interface IConnection {

  /**
   * Open a connection
   */
  connect(): Promise<IConnection>;

  /**
   * Optional direct query method
   */
  query?(query: any, parameters?: any[]): Promise<any[]>;

  /**
   * Close connection
   */
  close(): Promise<IConnection>;

  /**
   * Test the current connection configuration
   */
  ping?(): Promise<boolean>;

  /**
   * Return object handle for passed object
   *
   * @param type
   */
  for?<T>(type: EntityType<T>): IObjectHandle<T>;
}
