import {ILoggerApi} from '../logging/ILoggerApi';
import { ICache } from '../cache/ICache';

export interface IAsyncQueueOptions {
  /**
   * Name of the queue
   */
  name?: string;

  /**
   * Number of concurrent executions
   */
  concurrent?: number;

  /**
   * Override standard logger
   */
  logger?: ILoggerApi;

  /**
   * Override max listener limit default = 10000
   */
  maxListener?: number;

  /**
   * Use cache for data
   */
  cache?: ICache;

  /**
   * Cleanup task timeout
   */
  cleanupTimeout?: number;

}
