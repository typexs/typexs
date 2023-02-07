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
}
