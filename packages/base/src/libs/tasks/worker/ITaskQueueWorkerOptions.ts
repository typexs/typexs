import {IAsyncQueueOptions} from '../../queue/IAsyncQueueOptions';

export interface ITaskQueueWorkerOptions extends IAsyncQueueOptions {

  /**
   * value between 0 and 100
   */
  speedDownThreshold?: number;
}
