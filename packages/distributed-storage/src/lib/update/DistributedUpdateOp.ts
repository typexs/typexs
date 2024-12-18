import { DistributedStorageEntityController } from '../DistributedStorageEntityController';
import { System } from '@typexs/base/libs/system/System';
import { ClassType } from '@allgemein/schema-api';
import { AbstractMessage } from '@typexs/base/libs/messaging/AbstractMessage';
import { EntityControllerRegistry } from '@typexs/base/libs/storage/EntityControllerRegistry';
import { DistributedUpdateRequest } from './DistributedUpdateRequest';
import { DistributedUpdateResponse } from './DistributedUpdateResponse';
import { IDistributedUpdateOptions } from './IDistributedUpdateOptions';
import { IUpdateOp } from '@typexs/base/libs/storage/framework/IUpdateOp';
import { IWorkerInfo } from '@typexs/base/libs/worker/IWorkerInfo';
import { DistributedQueryWorker } from '../../workers/DistributedQueryWorker';

import { ClassUtils } from '@allgemein/base';
import { C_WORKERS } from '@typexs/base/libs/worker/Constants';
import { defaults, intersection, remove } from '@typexs/generic';


export class DistributedUpdateOp<T>
  extends AbstractMessage<DistributedUpdateRequest, DistributedUpdateResponse>
  implements IUpdateOp<T> {

  constructor(system: System, entityControllerRegistry: EntityControllerRegistry) {
    super(system, DistributedUpdateRequest, DistributedUpdateResponse);
    this.entityControllerRegistry = entityControllerRegistry;
    this.timeout = 10000;
  }


  protected entityControllerRegistry: EntityControllerRegistry;

  conditions: any;

  update: any;

  entityType: ClassType<T>;

  controller: DistributedStorageEntityController;

  getOptions(): IDistributedUpdateOptions {
    return this.options;
  }

  prepare(controller: DistributedStorageEntityController) {
    this.controller = controller;
    return this;
  }

  getConditions(): any {
    return this.conditions;
  }

  getUpdate(): any {
    return this.update;
  }

  getEntityType(): ClassType<T> {
    return this.entityType;
  }

  getController(): DistributedStorageEntityController {
    return this.controller;
  }


  async run(cls: ClassType<T>, condition: any, update: any, options?: IDistributedUpdateOptions): Promise<number> {
    this.entityType = cls;
    this.conditions = condition;
    this.update = update;
    this.options = options || {};

    defaults(this.options, {
      timeout: 10000
    });
    this.timeout = this.options.timeout;


    const req = new DistributedUpdateRequest();
    req.entityType = ClassUtils.getClassName(this.entityType);
    req.conditions = this.conditions;
    req.update = this.update;
    req.options = this.options;


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
    return this.results;
  }


  doPostProcess(responses: DistributedUpdateResponse[], err?: Error): any {
    const errors: any[] = [];
    const affected = {};
    for (const res of responses) {
      affected[res.nodeId] = res.affected;
      if (res.error) {
        errors.push(res.nodeId + ': ' + res.error.message);
      }
    }
    if (errors.length > 0) {
      throw new Error(errors.join('\n'));
    }
    return affected;
  }


}


