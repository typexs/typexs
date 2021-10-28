import * as _ from 'lodash';
import {UseAPI} from '@typexs/base/decorators/UseAPI';
import {EntityControllerApi} from 'packages/base/src/api/EntityControllerApi';
import {ISaveOp} from '@typexs/base/libs/storage/framework/ISaveOp';
import {IDeleteOp} from '@typexs/base/libs/storage/framework/IDeleteOp';
import {Inject, Invoker, Log} from '@typexs/base';
import {ClassUtils} from '@allgemein/base';
import {EventBus} from '@allgemein/eventbus';
import {IndexRuntimeStatus} from '../lib/IndexRuntimeStatus';
import {IndexEvent} from '../lib/events/IndexEvent';
import {ClassType} from '@allgemein/schema-api';
import {IndexElasticApi} from '../api/IndexElastic.api';

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
      if (_.has(this.status.getTypes(), name)) {
        const results = this.invoker.use(IndexElasticApi).isIndexable(name, obj);
        let pass = true;
        if (results && _.isArray(results) && results.length > 0) {
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
      if (_.has(this.status.getTypes(), name)) {
        indexable.push({
          ...this.status.getTypes()[name],
          class: name
        });
      }
    }
    return indexable;
  }

  isActive() {
    return this.status.checkIfActive() && this.status.isWorkerActive();
  }

  doAfterSave<T>(object: T[] | T, error: Error, op: ISaveOp<T>) {
    if (!this.isActive()) {
      return;
    }
    // we don't need to wait, use setTimeout
    const filterIndexable = this.filterIndexableObject(_.isArray(object) ? object : [object]);
    if (filterIndexable.length > 0) {
      setTimeout(() => {
        const prepared = filterIndexable
          .map(x => {
            const o = _.cloneDeep(x.obj);
            this.invoker.use(IndexElasticApi).prepareBeforeSave(x.class, o);
            const r = _.assign(x, <any>{action: 'save', obj: o});
            return r;
          });

        EventBus.post(
          new IndexEvent(prepared)
        ).catch(err => {
          Log.error(err);
        });
      });
    }
  }

  doBeforeRemove<T>(op: IDeleteOp<T>) {
    if (!this.isActive()) {
      return;
    }


    if (op.getConditions() !== null) {
      const filterTypes = this.filterIndexableTypes(<any>(
        _.isArray(op.getRemovable()) ? op.getRemovable() : [op.getRemovable()]
      ));

      if (filterTypes.length > 0) {
        EventBus.post(
          new IndexEvent(filterTypes
            .map(x =>
              _.assign(x, <any>{
                action: 'delete_by_condition',
                condition: op.getConditions()
              })
            )
          )
        )
          .catch(err => {
            Log.error(err);
          });
      }

    } else {
      const filterIndexable = this.filterIndexableObject(<any>(
        _.isArray(op.getRemovable()) ? op.getRemovable() : [op.getRemovable()]
      ));
      if (filterIndexable.length > 0) {
        // TODO create timeout post
        setTimeout(() => {
          EventBus.post(
            new IndexEvent(filterIndexable.map(x => _.assign(x, <any>{
              action: 'delete',
              options: op.getOptions()
            })))
          )
            .catch(err => {
              Log.error(err);
            });
        });
      }

    }
  }
}
