import { assign, concat, defaults, get, intersection, isUndefined, keys, orderBy, remove } from 'lodash';
import { DistributedStorageEntityController } from '../DistributedStorageEntityController';
import {
  __CLASS__,
  __NODE_ID__,
  __REGISTRY__,
  AbstractMessage,
  C_KEY_SEPARATOR, C_RAW,
  C_WORKERS,
  IFindOp,
  IWorkerInfo,
  Log,
  System,
  XS_P_$COUNT,
  XS_P_$LIMIT,
  XS_P_$OFFSET
} from '@typexs/base';
import { ClassRef, ClassType } from '@allgemein/schema-api';
import { DistributedQueryWorker } from '../../workers/DistributedQueryWorker';
import { DistributedFindResponse } from './DistributedFindResponse';
import { DistributedFindRequest } from './DistributedFindRequest';
import { IDistributedFindOptions } from './IDistributedFindOptions';
import { EntityControllerRegistry } from '@typexs/base/libs/storage/EntityControllerRegistry';
import { ClassUtils } from '@allgemein/base';


export class DistributedFindOp<T>
  extends AbstractMessage<DistributedFindRequest, DistributedFindResponse>
  implements IFindOp<T> {

  protected findConditions: any;

  protected entityType: Function | ClassType<T> | string;

  protected entityControllerRegistry: EntityControllerRegistry;

  controller: DistributedStorageEntityController;

  constructor(system: System, entityControllerRegistry: EntityControllerRegistry) {
    super(system, DistributedFindRequest, DistributedFindResponse);
    this.entityControllerRegistry = entityControllerRegistry;
    this.timeout = 10000;
  }

  getFindConditions() {
    return this.findConditions;
  }

  getEntityType(): string | Function | ClassType<T> {
    return this.entityType;
  }

  getOptions(): IDistributedFindOptions {
    return this.options;
  }

  getController(): DistributedStorageEntityController {
    return this.controller;
  }


  prepare(controller: DistributedStorageEntityController) {
    this.controller = controller;
    return this;
  }


  async run(entityType: Function | string | ClassType<T>, findConditions?: any, options?: IDistributedFindOptions): Promise<T[]> {
    this.findConditions = findConditions;
    this.entityType = ClassUtils.getClassName(entityType);
    this.options = options;

    defaults(options, {
      limit: 50,
      offset: null,
      sort: null,
      timeout: 10000
    });
    this.options = options;
    this.timeout = this.options.timeout;

    const req = new DistributedFindRequest();

    // max fetch limit
    if ((<IDistributedFindOptions>this.options).limit > 1000) {
      this.logger.debug(this.getSystem().getNodeId() + '[' + req.id + ']: limited request');
      (<IDistributedFindOptions>this.options).limit = 1000;
    }

    req.conditions = this.findConditions;
    req.entityType = this.entityType;
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

    if (this.targetIds.length !== 0) {
      await this.send(req);
    }

    return this.results;
  }


  doPostProcess(responses: DistributedFindResponse[], err?: Error): any {

    let results: any = null;
    let count = 0;

    const errors: string[] = [];
    responses.map(x => {
      count += x.count;
      if (x.error) {
        errors.push(x.nodeId + ': ' + x.error.message);
      }
    });

    if (errors.length > 0) {
      throw new Error(errors.join('\n'));
    }


    const classRefs = {};
    concat([], ...responses.map(x => x.results)).map(x => {
      const classRefName = x[__CLASS__];
      const registry = x[__REGISTRY__];
      const key = [classRefName, registry].join(C_KEY_SEPARATOR);
      if (!classRefs[key]) {
        classRefs[key] = ClassRef.get(classRefName, registry);
      }
    });

    if (get(this.options, C_RAW, false)) {
      results = concat([], ...responses.map(x => x.results)).map(x => {
        const classRefName = x[__CLASS__];
        const registry = x[__REGISTRY__];
        const key = [classRefName, registry].join(C_KEY_SEPARATOR);
        const ref = classRefs[key];
        const e = ref.create();
        assign(e, x);
        return e;
      });
    } else {
      results = concat([], ...responses.map(x => x.results))
        .map(r => {
          const classRefName = r[__CLASS__];
          const registry = r[__REGISTRY__];
          const key = [classRefName, registry].join(C_KEY_SEPARATOR);
          const ref = classRefs[key];
          try {
            return ref.build(r, {
              afterBuild: (c: any, f: any, t: any) =>  Object.keys(f)
                .filter(k => k.startsWith('__') && isUndefined(t[k]))
                .map(k => t[k] = f[k])
            });
          } catch (err) {
            Log.error(err);
            const e = ref.create();
            assign(e, r);
            return e;
          }
        });
    }

    if (get(this.request.options, 'sort', false)) {
      const arr: string[][] = [];
      // order after concat
       Object.keys(this.request.options.sort).forEach(k => {
        arr.push([k, this.request.options.sort[k].toUpperCase() === 'ASC' ? 'asc' : 'desc']);
      });
      orderBy(results, ...arr);
    }

    if (this.options.outputMode === 'map') {
      const mappedResults: any = {};
      mappedResults[XS_P_$COUNT] = count;
      mappedResults[XS_P_$LIMIT] = this.request.options.limit;
      mappedResults[XS_P_$OFFSET] = this.request.options.offset;
      results.forEach((x: any) => {
        if (!mappedResults[x[__NODE_ID__]]) {
          mappedResults[x[__NODE_ID__]] = [];
          mappedResults[x[__NODE_ID__]][XS_P_$COUNT] = responses.find(x => x.nodeId === x[__NODE_ID__]).count;
          mappedResults[x[__NODE_ID__]][XS_P_$OFFSET] = responses.find(x => x.nodeId === x[__NODE_ID__]).offset;
          mappedResults[x[__NODE_ID__]][XS_P_$LIMIT] = responses.find(x => x.nodeId === x[__NODE_ID__]).limit;
        }
        mappedResults[x[__NODE_ID__]].push(x);
      });
      return mappedResults;
    }

    results[XS_P_$COUNT] = count;
    results[XS_P_$LIMIT] = this.request.options.limit;
    results[XS_P_$OFFSET] = this.request.options.offset;
    return results;
  }

}


