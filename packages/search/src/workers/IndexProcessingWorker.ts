import { Inject, IWorker } from '@typexs/base';
import { EventBus, subscribe } from '@allgemein/eventbus';
import { IndexEvent } from '../lib/events/IndexEvent';
import { IndexProcessingQueue } from '../lib/IndexProcessingQueue';
import { IndexRuntimeStatus } from '../lib/IndexRuntimeStatus';

export class IndexProcessingWorker implements IWorker {

  name: string = IndexProcessingWorker.name;

  @Inject(() => IndexRuntimeStatus)
  status: IndexRuntimeStatus;

  @Inject(() => IndexProcessingQueue)
  queue: IndexProcessingQueue;

  active: boolean;

  async prepare(options?: any) {
    this.active = this.status.checkIfActive();
    if (this.active) {
      this.status.activateWorker();
      // this.queue = Injector.create(IndexProcessingQueue);
      // await this.queue.prepare();
      await EventBus.register(this);
    }
  }


  @subscribe(IndexEvent)
  on(event: IndexEvent) {
    this.queue.add(event);
  }


  async finish() {
    if (this.active) {
      await EventBus.unregister(this);
      await this.queue.shutdown();
    }
  }


}
