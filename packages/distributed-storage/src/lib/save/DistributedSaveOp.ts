import { defaults, first, get, intersection, isArray, isEmpty, remove, set } from '@typexs/generic';


import { DistributedStorageEntityController } from '../DistributedStorageEntityController';
import { System } from '@typexs/base/libs/system/System';
import { ClassRef } from '@allgemein/schema-api';
import { ISaveOp } from '@typexs/base/libs/storage/framework/ISaveOp';
import { DistributedSaveRequest } from './DistributedSaveRequest';
import { DistributedSaveResponse } from './DistributedSaveResponse';
import { __DISTRIBUTED_ID__, __REMOTE_IDS__, XS_P_$ERRORED, XS_P_$SAVED } from '../Constants';
import { IDistributedSaveOptions } from './IDistributedSaveOptions';
import { AbstractMessage } from '@typexs/base/libs/messaging/AbstractMessage';
import { IMessageOptions } from '@typexs/base/libs/messaging/IMessageOptions';
import { C_WORKERS } from '@typexs/base/libs/worker/Constants';
import { DistributedQueryWorker } from '../../workers/DistributedQueryWorker';
import { IWorkerInfo } from '@typexs/base/libs/worker/IWorkerInfo';
import { EntityControllerRegistry } from '@typexs/base/libs/storage/EntityControllerRegistry';
import { BaseUtils } from '@typexs/base/libs/utils/BaseUtils';
import { __CLASS__, __REGISTRY__ } from '@typexs/base/libs/Constants';


export class DistributedSaveOp<T>
  extends AbstractMessage<DistributedSaveRequest,
    DistributedSaveResponse> implements ISaveOp<T> {

  constructor(system: System, entityControllerRegistry: EntityControllerRegistry) {
    super(system, DistributedSaveRequest, DistributedSaveResponse);
    this.entityControllerRegistry = entityControllerRegistry;
    this.timeout = 10000;
  }

  private objects: any[] = [];

  // private entityRefs: { [k: string]: IEntityRef } = {};

  private isArray: boolean;


  protected entityControllerRegistry: EntityControllerRegistry;

  controller: DistributedStorageEntityController;

  getOptions(): IDistributedSaveOptions & IMessageOptions {
    return this.options;
  }

  getObjects(): T[] {
    return this.objects;
  }

  getIsArray(): boolean {
    return this.isArray;
  }

  getController(): DistributedStorageEntityController {
    return this.controller;
  }

  prepare(controller: DistributedStorageEntityController) {
    this.controller = controller;
    return this;
  }

  async run(objects: T | T[], options?: IDistributedSaveOptions): Promise<T[]> {
    this.options = defaults(options, { timeout: 10000 });
    this.timeout = this.options.timeout;

    let inc = 0;
    this.isArray = isArray(objects);
    this.objects = isArray(objects) ? objects : [objects];

    // mark objects
    this.objects.forEach((o: any) => {
      set(o, __DISTRIBUTED_ID__, inc++);
    });

    // create request event
    const req = new DistributedSaveRequest();
    req.objects = BaseUtils.resolveByClassName(this.objects);
    req.options = this.options;

    //  Object.keys(req.objects).map(entityType => {
    //   this.entityRefs[entityType] = TypeOrmEntityRegistry.$().getEntityRefFor(entityType);
    // });


    // also fire self
    this.targetIds = this.system.getNodesWith(C_WORKERS)
      .filter(n => n.contexts
        .find(c => c.context === C_WORKERS).workers
        .find((w: IWorkerInfo) => w.className === DistributedQueryWorker.name))
      .map(n => n.nodeId);

    if (this.options.targetIds) {
      this.targetIds = intersection(this.targetIds, this.options.targetIds);
    }

    if (this.options.skipLocal) {
      remove(this.targetIds, x => x === this.getSystem().getNodeId());
    }

    if (this.targetIds.length === 0) {
      throw new Error('no distributed worker found to execute the query.');
    }

    // this.request.targetIds = this.targetIds;
    if (this.targetIds.length === 0) {
      return this.results;
    }

    await this.send(req);

    return this.objects;
  }


  doPostProcess(responses: DistributedSaveResponse[], err: Error) {
    const errors: any[] = [];
    let saved = 0;
    let errored = 0;
    for (const event of responses) {
      if (!isEmpty(event.error)) {
        errors.push(event.nodeId + ': ' + event.error.message);
        errored++;
        continue;
      }
       Object.keys(event.results).map(entityType => {
        const obj = first(event.results[entityType]);
        if (!obj) {
          return;
        }
        const ref = ClassRef.get(obj[__CLASS__], obj[__REGISTRY__]);
        const ids = ref.getPropertyRefs().filter(p => p.isIdentifier());

        for (const entry of event.results[entityType]) {
          const distributedId = get(entry, __DISTRIBUTED_ID__);
          const id = {};
          ids.forEach(_id => {
            id[_id.name] = _id.get(entry);
          });
          const localObject = this.objects.find(x => get(x, __DISTRIBUTED_ID__) === distributedId);
          if (!localObject[__REMOTE_IDS__]) {
            localObject[__REMOTE_IDS__] = {};
          }
          saved++;
          localObject[__REMOTE_IDS__][event.nodeId] = id;
        }
      });
    }

    if (errors.length > 0) {
      throw new Error(errors.join('\n'));
    }

    this.objects[XS_P_$SAVED] = saved;
    this.objects[XS_P_$ERRORED] = errored;

    return this.objects;
  }


}


