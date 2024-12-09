import { uniq, uniqBy } from '@typexs/generic';


import { LockFactory, Semaphore } from '@allgemein/base';
import { AsyncWorkerQueue, ILoggerApi, Inject, Invoker, IQueueProcessor, Log, Storage } from '@typexs/base';
import { IndexRuntimeStatus } from './IndexRuntimeStatus';
import { IIndexData } from './events/IIndexData';
import { IIndexStorageRef } from './IIndexStorageRef';
import { IndexEvent } from './events/IndexEvent';
import { ClassRef } from '@allgemein/schema-api';


export class IndexProcessingQueue implements IQueueProcessor<IIndexData> {

  static NAME = IndexProcessingQueue.name;

  @Inject(IndexRuntimeStatus.NAME)
  status: IndexRuntimeStatus;

  @Inject(Storage.NAME)
  storage: Storage;

  @Inject(Invoker.NAME)
  invoker: Invoker;

  LOCK: Semaphore;

  refreshIndexRef: { class: string; registry: string; ref: string }[] = [];

  queue: AsyncWorkerQueue<IIndexData>;

  logger: ILoggerApi;

  constructor() {
    this.logger = Log.getLoggerFor(IndexProcessingQueue);
  }

  async prepare() {
    const status = this.status.checkIfActive();
    if (status) {
      this.LOCK = LockFactory.$().semaphore(1);
      this.queue = new AsyncWorkerQueue<IIndexData>(this, { name: 'index_event_dispatcher', logger: this.logger, concurrent: 50 });
    }
    return status;
  }


  push(data: IIndexData) {
    return this.queue.push(data);
  }

  add(event: IndexEvent) {
    for (const entry of event.data) {
      if (entry.action === 'save' || entry.action === 'delete') {
        const classRef = ClassRef.get(entry.class, entry.registry);
        const obj = classRef.build(entry.obj, { createAndCopy: true });
        this.push(<IIndexData>{
          ref: entry.ref,
          action: entry.action,
          obj: obj,
          options: entry.options,
          class: entry.class,
          registry: entry.registry
        });
      } else if (entry.action === 'delete_by_condition') {
        const classRef = ClassRef.get(entry.class, entry.registry);
        this.push(<IIndexData>{
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

  getStatus(){
    return this.status;
  }


  do(event: IIndexData) {
    const pass = this.getStatus().isIndexable(event.class, event.obj, event.registry);
    if (!pass) {
      return null;
    }

    let res = null;
    try {
      if (event.ref && event.registry && event.class) {
        // clearTimeout(this.timeout);
        this.refreshIndexRef.push({ ref: event.ref, class: event.class, registry: event.registry });
      }

      if (event.action === 'save') {

        // TODO resolve by refs
        res = this.storage.get(event.ref).getController().save(event.obj, event.options);
      } else if (event.action === 'delete') {
        res = this.storage.get(event.ref).getController().remove(event.obj, event.options);
      } else if (event.action === 'delete_by_condition') {
        res = this.storage.get(event.ref).getController().remove(event.obj, event.condition, event.options);
      }
    } catch (e) {
      this.logger.error(e.stack);
    }
    return res;
  }


  async await(): Promise<null> {
    if (this.queue) {
      await this.queue.await();
      await this.LOCK.await(5000);
    }
    return null;
  }


  async refresh() {
    try {
      const indexNames: { [ref: string]: string[] } = {};
      const refreshFor = uniqBy(this.refreshIndexRef, x => JSON.stringify(x));
      this.refreshIndexRef = [];
      refreshFor.forEach(x => {
        const ref = (this.storage.get(x.ref) as IIndexStorageRef);
        const indexType = ref.getEntityRef(x.class, true);
        if (!indexType) {
          return;
        }
        if (!indexNames[x.ref]) {
          indexNames[x.ref] = [];
        }
        indexNames[x.ref].push(indexType.getAliasName());
      });

      for (const refKey of  Object.keys(indexNames)) {
        const indicies = uniq(indexNames[refKey]);
        this.queue.getLogger().debug('refresh indicies of storage ref ' + refKey + ' ' + JSON.stringify(indicies));
        await (this.storage.get(refKey) as IIndexStorageRef).refresh(indicies);
      }
    } catch (e) {
      this.queue.getLogger().error(e.stack);
    }
  }


  async onEmpty() {
    if (this.refreshIndexRef.length === 0) {
      return;
    }
    const inc = this.queue.getInc();
    await this.LOCK.acquire();
    await new Promise(resolve => {
      setTimeout(() => {
        resolve(true);
      }, 500);
    });
    if (this.queue.getInc() === inc) {
      await this.refresh();
    }
    this.LOCK.release();
  }

  async shutdown() {
    if (this.queue) {
      // await EventBus.unregister(this);
      return this.queue.shutdown(true);
    }
    return null;
  }
}
