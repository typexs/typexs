import * as _ from 'lodash';
import {AsyncWorkerQueue, ILoggerApi, Inject, IQueueProcessor, Log, Semaphore, Storage} from '@typexs/base';
import {IndexRuntimeStatus} from '../IndexRuntimeStatus';
import {IIndexData} from './IIndexData';
import {IIndexStorageRef} from '../IIndexStorageRef';
import {LockFactory} from '@typexs/base/libs/LockFactory';


export class IndexProcessingQueue implements IQueueProcessor<IIndexData> {

  // name: IndexProcessingWorker

  @Inject(() => IndexRuntimeStatus)
  status: IndexRuntimeStatus;

  @Inject(Storage.NAME)
  storage: Storage;

  LOCK: Semaphore;

  refreshIndexRef: { class: string, registry: string, ref: string }[] = [];

  queue: AsyncWorkerQueue<IIndexData>;

  logger: ILoggerApi;

  // timeout: NodeJS.Timeout;

  constructor() {
    this.logger = Log.getLoggerFor(IndexProcessingQueue);
  }

  async prepare() {
    const status = await this.status.checkIfActive();
    if (status) {
      this.LOCK = LockFactory.$().semaphore(1);
      this.queue = new AsyncWorkerQueue<IIndexData>(this, {name: 'index_event_dispatcher', logger: this.logger, concurrent: 50});
    }
    return status;
  }

  push(data: IIndexData) {
    return this.queue.push(data);
  }

  do(event: IIndexData) {
    let res = null;
    try {
      if (event.ref && event.registry && event.class) {
        // clearTimeout(this.timeout);
        this.refreshIndexRef.push({ref: event.ref, class: event.class, registry: event.registry});
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
      this.logger.error(e);
    }
    return res;
  }


  async await() {
    if (this.queue) {
      await this.queue.await();
      await this.LOCK.await(5000);
    }
    return null;
  }


  async refresh() {
    try {
      const indexNames: { [ref: string]: string[] } = {};
      const refreshFor = _.uniqBy(this.refreshIndexRef, x => JSON.stringify(x));
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
        indexNames[x.ref].push(indexType.getIndexName());
      });

      for (const refKey of _.keys(indexNames)) {
        const indicies = _.uniq(indexNames[refKey]);
        this.queue.logger.debug('refresh indicies of storage ref ' + refKey + ' ' + JSON.stringify(indicies));
        await (this.storage.get(refKey) as IIndexStorageRef).refresh(indicies);
      }
    } catch (e) {
      this.queue.logger.error(e);
    }
  }


  async onEmpty() {
    if (this.refreshIndexRef.length === 0) {
      return;
    }
    const inc = this.queue._inc;
    await this.LOCK.acquire();
    await new Promise(resolve => {
      setTimeout(() => {
        resolve(true);
      }, 500);
    });
    if (this.queue._inc === inc) {
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
