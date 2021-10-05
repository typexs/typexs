import { IQueueWorkload } from './IQueueWorkload';
import { QueueJob } from './QueueJob';
import { IQueue } from './IQueue';


export class QueueJobRef<T extends IQueueWorkload> {

  id: string;

  queue: IQueue;

  constructor(q: IQueue, id: string) {
    this.queue = q;
    this.id = id;
  }

  get(): Promise<QueueJob<T>> {
    return this.queue.get(this.id);
  }
}
