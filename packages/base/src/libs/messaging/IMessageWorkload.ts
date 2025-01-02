import { IQueueWorkload } from '@allgemein/queue';
import { AbstractEvent } from './AbstractEvent';

export interface IMessageWorkload extends IQueueWorkload {

  /**
   * Received event
   */
  event: AbstractEvent;

}


