import { UseAPI } from '@typexs/base/decorators/UseAPI';
import { EntityControllerApi, Inject, Injector, Invoker, Log } from '@typexs/base';
import { ISaveOp } from '@typexs/base/libs/storage/framework/ISaveOp';
import { IDeleteOp } from '@typexs/base/libs/storage/framework/IDeleteOp';
import { ClassUtils } from '@allgemein/base';
import { EventBus } from '@allgemein/eventbus';
import { IndexRuntimeStatus } from '../lib/IndexRuntimeStatus';
import { IndexEvent } from '../lib/events/IndexEvent';
import { ClassType } from '@allgemein/schema-api';
import { IndexElasticApi } from '../api/IndexElastic.api';
import { IndexProcessingQueue } from '../lib/events/IndexProcessingQueue';
import { assign, cloneDeep, has, isArray } from 'lodash';

@UseAPI(EntityControllerApi)
export class ExtendEntityControllerApi extends EntityControllerApi {
  // check if worker is online, pass objects

  @Inject(() => IndexRuntimeStatus)
  status: IndexRuntimeStatus;

  @Inject(Invoker.NAME)
  invoker: Invoker;

  filterIndexableObject<T>(object: T[]) {
    const indexable: { ref: string; class: string; registry: string; obj: T }[] = [];
    for (const obj of object) {
      const name = ClassUtils.getClassName(obj as any);
      if (has(this.status.getTypes(), name)) {
        const results = this.invoker.use(IndexElasticApi).isIndexable(name, obj);
        let pass = true;
        if (results && isArray(results) && results.length > 0) {
          pass = results.reduce((previousValue, currentValue) => previousValue && currentValue, pass);
        }
        if (pass) {
          indexable.push({
            ...this.status.getTypes()[name],
            class: name,
            obj: obj
          });
        }
      }
    }
    return indexable;
  }

  filterIndexableTypes<T>(types: ClassType<T>[]) {
    const indexable: { ref: string; class: string; registry: string }[] = [];
    for (const obj of types) {
      const name = ClassUtils.getClassName(obj as any);
      if (indexable.find(x => x.class === name)) {
        continue;
      }
      if (has(this.status.getTypes(), name)) {
        indexable.push({
          ...this.status.getTypes()[name],
          class: name
        });
      }
    }
    return indexable;
  }

  isActive() {
    return this.status.checkIfActive();
  }

  isWorkerActive() {
    return this.status.isWorkerActive();
  }


  doAfterSave<T>(object: T[] | T, error: Error, op: ISaveOp<T>) {
    if (!this.isActive()) {
      return;
    }

    // we don't need to wait, use setTimeout
    const filterIndexable = this.filterIndexableObject(isArray(object) ? object : [object]);
    if (filterIndexable.length > 0) {
      const prepared = filterIndexable
        .map(x => {
          const o = cloneDeep(x.obj);
          this.invoker.use(IndexElasticApi).prepareBeforeSave(x.class, o);
          const r = assign(x, <any>{ action: 'save', obj: o });
          return r;
        });
      const event = new IndexEvent(prepared);
      this.processEvent(event);
    }
  }

  doBeforeRemove<T>(op: IDeleteOp<T>) {
    if (!this.isActive()) {
      return;
    }

    if (this.isWorkerActive()) {
      if (op.getConditions() !== null) {
        const filterTypes = this.filterIndexableTypes(<any>(
          isArray(op.getRemovable()) ? op.getRemovable() : [op.getRemovable()]
        ));

        if (filterTypes.length > 0) {
          const event = new IndexEvent(filterTypes
            .map(x =>
              assign(x, <any>{
                action: 'delete_by_condition',
                condition: op.getConditions()
              })
            )
          );

          this.processEvent(event);

        }

      } else {
        const filterIndexable = this.filterIndexableObject(<any>(
          isArray(op.getRemovable()) ? op.getRemovable() : [op.getRemovable()]
        ));
        if (filterIndexable.length > 0) {
          const event = new IndexEvent(filterIndexable.map(x => assign(x, <any>{
            action: 'delete',
            options: op.getOptions()
          })));
          this.processEvent(event);

        }
      }
    }
  }

  processEvent(event: IndexEvent) {
    if (this.isWorkerActive()) {
      EventBus.post(event).catch(err => {
        Log.error(err);
      });
    } else {
      try {
        Injector.get(IndexProcessingQueue).add(event);
      } catch (e) {
        Log.error(e);
      }
    }

  }
}
