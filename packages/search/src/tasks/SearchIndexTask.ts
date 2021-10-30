import { EntityControllerRegistry, Incoming, Inject, Injector, ITask, ITaskRuntimeContainer, TaskRuntime } from '@typexs/base';
import { IndexRuntimeStatus } from '../lib/IndexRuntimeStatus';
import { IndexProcessingQueue } from '../lib/events/IndexProcessingQueue';
import { TN_INDEX } from '../lib/Constants';
import { IReader } from '@typexs/pipelines/lib/reader/IReader';
import { assign, isEmpty } from 'lodash';
import { ControllerReader } from '@typexs/pipelines/adapters/pipeline/readers/ControllerReader';


export class SearchIndexTask implements ITask {

  name = TN_INDEX;

  @Incoming({
    optional: true, handle: x =>
      x.split(',').map((x: any) => x.trim()).filter((x: any) => !isEmpty(x))
  })
  entityNames: string[];

  @Inject(() => IndexRuntimeStatus)
  status: IndexRuntimeStatus;

  @Inject(EntityControllerRegistry.NAME)
  controllerRegistry: EntityControllerRegistry;

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

    let defs = [];
    if (!this.entityNames) {
      defs = this.status.getTypes();
    } else {
      defs = this.status.getTypes().filter(x => this.entityNames.includes(x.className));
    }

    const reader: IReader[] = [];
    for (const x of defs) {
      const type = this.status.getTypeForObject(x.className, x.registry);
      if (!type) {
        continue;
      }
      const indexStorageRef = this.status.getStorageRef(type.ref);
      const entityRef = indexStorageRef.getEntityRef(x.className, true);
      const clazzIdx = entityRef.getClass();
      const clazzRef = entityRef.getEntityRef().getClassRef();
      const clazz = clazzRef.getClass();

      const registry = entityRef.getEntityRef().getNamespace();
      const sourceRef = this.status.getStorage().forClass(clazz);

      const raw = sourceRef.getType() === 'mongodb';

      const deleted = await indexStorageRef.getController().remove(clazzIdx, {});
      this.runtime.counter('deleted.' + clazz.name).value = deleted;

      const doit = new ControllerReader({
        entityType: clazz as any,
        size: 50,
        raw: raw
      });

      doit.pipe((x: any) => {
        if (raw) {
          const r = Reflect.construct(clazz, []);
          assign(r, x);
          x = r;
        }
        this.runtime.counter('index').inc();
        this.runtime.counter('class.' + clazz.name).inc();
        dispatcher.queue.push({ action: 'save', ref: type.ref, obj: x, class: clazz.name, registry: registry });
      });

      doit.onCatch(
        (err: Error) => logger.error(err.stack)
      );
      reader.push(doit);
    }

    let results = null;
    if (reader.length > 0) {
      try {
        results = await Promise.all(reader.map(r => r.run()));
      } catch (e) {
        logger.error(e.stack);
      }
    }

    await dispatcher.await();
    await dispatcher.shutdown();
    return results;
  }
}
