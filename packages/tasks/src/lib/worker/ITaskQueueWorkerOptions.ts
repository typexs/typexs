import { IAsyncQueueOptions } from '@allgemein/queue';

export interface ITaskQueueWorkerOptions extends IAsyncQueueOptions {

  /**
   * value between 0 and 100
   */
  speedDownThreshold?: number;

  /**
   * Load average intervall
   */
  loadAverageInterval?: number;
}
