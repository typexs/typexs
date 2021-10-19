import {Inject, Injector, IWorker} from '@typexs/base';
import {EventBus, subscribe} from '@allgemein/eventbus';
import {IndexEvent} from '../lib/events/IndexEvent';
import {ClassRef} from '@allgemein/schema-api';
import {IIndexData} from '../lib/events/IIndexData';
import {IndexProcessingQueue} from '../lib/events/IndexProcessingQueue';
import {IndexRuntimeStatus} from '../lib/IndexRuntimeStatus';

export class IndexProcessingWorker implements IWorker {

  name: string = IndexProcessingWorker.name;

  @Inject(() => IndexRuntimeStatus)
  status: IndexRuntimeStatus;

  queue: IndexProcessingQueue;

  active: boolean;

  async prepare(options?: any) {
    this.active = this.status.checkIfActive();
    if (this.active) {
      this.status.activateWorker();
      this.queue = Injector.create(IndexProcessingQueue);
      await this.queue.prepare();
      await EventBus.register(this);
    }
  }


  @subscribe(IndexEvent)
  on(event: IndexEvent) {
    for (const entry of event.data) {
      if (entry.action === 'save' || entry.action === 'delete') {
        const classRef = ClassRef.get(entry.class, entry.registry);
        const obj = classRef.build(entry.obj, {createAndCopy: true});
        this.queue.push(<IIndexData>{
          ref: entry.ref,
          action: entry.action,
          obj: obj,
          options: entry.options,
          class: entry.class,
          registry: entry.registry
        });
      } else if (entry.action === 'delete_by_condition') {
        const classRef = ClassRef.get(entry.class, entry.registry);
        this.queue.push(<IIndexData>{
          ref: entry.ref,
          action: entry.action,
          obj: classRef.getClass(),
          condition: entry.condition,
          options: entry.options,
          class: entry.class,
          registry: entry.registry
        });

      }
    }
  }


  async finish() {
    if (this.active) {
      await EventBus.unregister(this);
      await this.queue.shutdown();
    }
  }


}
