import * as _ from 'lodash';
import {Incoming, Inject, Injector, ITask, ITaskRuntimeContainer, TaskRuntime} from '@typexs/base';
import {IndexRuntimeStatus} from '../lib/IndexRuntimeStatus';
import {IndexProcessingQueue} from '../lib/events/IndexProcessingQueue';
import {StorageControllerReader} from '../../../../adapters/pipeline/readers/StorageControllerReader';
import {IIndexStorageRef} from '../lib/IIndexStorageRef';
import {TN_INDEX} from '../lib/Constants';


export class IndexTask implements ITask {

  name = TN_INDEX;

  @Incoming({
    optional: true, handle: x =>
      x.split(',').map(x => x.trim()).filter(x => !_.isEmpty(x))
  })
  entityNames: string[];

  @Inject(() => IndexRuntimeStatus)
  status: IndexRuntimeStatus;

  @TaskRuntime()
  runtime: ITaskRuntimeContainer;

  async exec() {
    const logger = this.runtime.logger();

    const active = await this.status.checkIfActive();
    if (!active) {
      logger.info('not active configuration for indexing found');
      return null;
    }

    const dispatcher = Injector.create(IndexProcessingQueue);
    await dispatcher.prepare();

    if (!this.entityNames) {
      this.entityNames = _.keys(this.status.getTypes());
    }

    const reader: StorageControllerReader<any>[] = [];
    for (const x of this.entityNames) {
      const type = this.status.getTypeForObject(x);
      if (!type) {
        continue;
      }
      const indexRef = this.status.getStorageRef(type.ref) as IIndexStorageRef;
      const entityRef = indexRef.getEntityRef(x, true);
      const clazzIdx = entityRef.getClass();
      const clazz = entityRef.getEntityRef().getClassRef().getClass();
      const registry = entityRef.getEntityRef().getLookupRegistry().getName();
      const sourceRef = this.status.getStorage().forClass(clazz);

      const raw = sourceRef.getType() === 'mongodb';

      const deleted = await indexRef.getController().remove(clazzIdx, {});
      this.runtime.counter('deleted.' + clazz.name).value = deleted;
      const doit = new StorageControllerReader({
        entityType: clazz as any,
        storageName: sourceRef.getName(),
        size: 50,
        raw: raw
      });

      doit.pipe(x => {
        if (raw) {
          const r = Reflect.construct(clazz, []);
          _.assign(r, x);
          x = r;
        }
        this.runtime.counter('index').inc();
        this.runtime.counter('class.' + clazz.name).inc();
        dispatcher.queue.push({action: 'save', ref: type.ref, obj: x, class: clazz.name, registry: registry});
      });

      reader.push(doit);
    }

    let results = null;
    if (reader.length > 0) {
      try {
        results = await Promise.all(reader.map(r => r.run()));
      } catch (e) {
        logger.error(e);
      }
    }

    await dispatcher.await();
    await dispatcher.shutdown();
    return results;
  }
}
