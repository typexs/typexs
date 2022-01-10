import * as _ from 'lodash';
import sha1 from 'sha1';
import {chunk, find, isArray, isEmpty, isNull, remove} from 'lodash';
import {
  AsyncWorkerQueue,
  IConnection,
  IEntityController,
  Injector,
  IQueueProcessor,
  ISaveOptions,
  NotYetImplementedError,
  Storage,
  StorageRef,
  TypeOrmConnectionWrapper,
  TypeOrmEntityRegistry

} from '@typexs/base';
import { ClassType, IEntityRef, ClassRef} from '@allgemein/schema-api';
import {LockFactory, TreeUtils} from '@allgemein/base';
import { IProcessorOptions, Processor } from '../../../lib/Processor';
import { XS_ID_SEP, XS_STATE_KEY } from '../../../lib/Constants';
import { IRevisionSupport } from '../../../lib/IRevisionSupport';


export interface IStorageControllerProcessorOptions<T> extends IProcessorOptions, ISaveOptions {
  queued?: boolean;
  storageName?: string;
  targetType: ClassType<T>;
  targetRevType?: ClassType<T>;
  revisionLimit?: number;
  // revisions?: boolean
}

export interface IInstruction {
  instance?: any;
  instanceRev?: any;
  searchCond?: any;
  orgId?: any;
  id?: any;
  [XS_STATE_KEY]?: any;

}

export class StorageControllerProcessor<T> extends Processor implements IQueueProcessor<any> {

  constructor(opts: IStorageControllerProcessorOptions<T>) {
    super(_.defaults(opts, {revisions: false, revisionLimit: 5, queued: false}));

    this.entityRef = TypeOrmEntityRegistry.$().getEntityRefFor(opts.targetType);
    if (opts.targetRevType) {
      this.entityRevRef = TypeOrmEntityRegistry.$().getEntityRefFor(opts.targetRevType);
    }

    this.storageName = opts.storageName;
    const storage = (<Storage>Injector.get(Storage.NAME));
    this.storageRef = null;
    if (this.storageName) {
      this.storageRef = storage.get(this.storageName);
    } else {
      this.storageRef = storage.forClass(this.entityRef.getClassRef());
    }

    this.controller = this.storageRef.getController();
  }

  connection: IConnection;

  storageName: string;

  storageRef: StorageRef;

  entityRef: IEntityRef;

  entityRevRef: IEntityRef;

  controller: IEntityController;

  queue: AsyncWorkerQueue<any>;

  statistic: any = {
    count: 0
  };

  static sha1(json: any) {
    return sha1(JSON.stringify(json) + JSON.stringify(_.keys(json)));
  }

  revisionLimit() {
    return this.getOptions().revisionLimit;
  }

  async doInit() {
    this.connection = await this.storageRef.connect();
    // TODO
    this.statistic.processor = StorageControllerProcessor.name;
    this.statistic.entityRef = this.entityRef.name;

    if (this.getOptions().queued) {
      this.queue = new AsyncWorkerQueue<any>(this, {concurrent: 10, name: 'storage-controller-processor'});
    }
  }


  async doFinish() {
    if (this.queue) {
      await this.queue.await();
    }
    await this.connection.close();
    return this.statistic;
  }


  supportsRevisions() {
    return !_.isNull(this.entityRevRef) && !_.isUndefined(this.entityRevRef);
  }


  getOptions(): IStorageControllerProcessorOptions<T> {
    return <any>this.$options;
  }

  do(workLoad: T): Promise<any> {
    return this._doProcess(workLoad);
  }

  doProcess(data: T | T[]) {
    if (this.queue) {
      return this.queue.push(data);
    } else {
      return this._doProcess(data);
    }
  }


  async _doProcess(data: T | T[]) {
    const ret: any[] = [];
    let arrData = [];
    let _isArray = false;
    if (!isArray(data)) {
      arrData = [data];
    } else {
      _isArray = true;
      arrData = data;
    }
    if (isEmpty(arrData)) {
      if (_isArray) {
        return [];
      }
      return null;
    }

    let processInstructions: IInstruction[] = [];

    const dataChunks = chunk(arrData, 100);
    const chunksAmount = dataChunks.length;
    const semaphore = LockFactory.$().semaphore(50);
    let inc = 1;
    let promises: Promise<any>[] = [];
    while (dataChunks.length > 0) {

      const dataChunk = dataChunks.shift();
      await semaphore.acquire();
      const p = this._doProcessChunk(dataChunk).then(chunkedInstruction => {
        if (!isEmpty(chunkedInstruction)) {
          processInstructions.push(...chunkedInstruction);
          for (const inst of chunkedInstruction) {
            const state = _.get(inst, XS_STATE_KEY, 'none');
            this.statistic.count++;
            _.set(this.statistic, state, _.get(this.statistic, state, 0) + 1);
            if(chunksAmount === 1){
              this.logger.debug(`storage process ` + this.entityRef.name + '[' + inc + '/' + chunksAmount +
                '] with id=' + inst.id + ' state=' + state + ' count=' + this.statistic.count);
            }
            ret.push(inst.instance);
          }
          if(chunksAmount !== 1){
            this.logger.debug(`storage chunk processed ` + this.entityRef.name + ' [' + inc + '/' + chunksAmount +
              '] with ' + JSON.stringify(this.statistic));
          }
        }
      });
      p.finally(() => {
        semaphore.release();
        inc++;
        remove(promises, x => x === p);
      });
      promises.push(p);
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }

    semaphore.purge();
    LockFactory.$().remove(semaphore);

    if (_isArray) {
      return ret;
    } else {
      return ret.shift();
    }

  }


  async _doProcessChunk(dataChunk: any[]) {
    let chunkedInstruction = [];


    for (const x of dataChunk) {
      const ref = ClassRef.getGlobal(x.constructor);
      const idprops = ref.getPropertyRefs().filter(p => p.isIdentifier());
      const instance = this.entityRef.create();
      _.assign(instance, x);
      let processInstruction: IInstruction = {instance: instance};
      processInstruction[XS_STATE_KEY] = 'new';
      chunkedInstruction.push(processInstruction);


      let searchCond: any = null;
      processInstruction.id = idprops.map(id => id.get(instance)).join(':');
      if (this.storageRef.getType() === 'mongodb') {

        searchCond = {};

        // remove $-fields for save
        await TreeUtils.walk(instance, x => {
          if (x.key && _.isString(x.key) && ['$'].includes(x.key[0])) {
            delete x.parent[x.key];
          }
        });

        idprops.forEach(id => {
          searchCond[id.storingName] = id.get(instance);
        });

        // generate _id if not exists!
        if (!_.has(instance, '_id')) {
          (<any>instance)._id = _.concat([
              this.entityRef.getClassRef().storingName],
            _.values(searchCond)).join(XS_ID_SEP);
        }
      }

      if (this.supportsRevisions()) {
        if (this.storageRef.getType() === 'mongodb') {

          const json = JSON.parse(JSON.stringify(instance));
          await TreeUtils.walk(json, x => {
            if (x.key && _.isString(x.key) && ['_'].includes(x.key[0])) {
              delete x.parent[x.key];
            }
          });

          const instanceRev: IRevisionSupport = <IRevisionSupport><any>instance;
          const orgId = instanceRev._id;
          instanceRev._hash = StorageControllerProcessor.sha1(json);
          instanceRev._orgId = orgId;
          instanceRev._revNo = 1;
          instanceRev._created = new Date();
          instanceRev._updated = instanceRev._created;
          processInstruction.instanceRev = instanceRev;
          processInstruction.orgId = orgId;
          searchCond['_id'] = orgId;
        } else {
          throw new NotYetImplementedError('only mongodb can have currently revision');
        }
      }
      processInstruction.searchCond = searchCond;
    }

    const saveEntities = [];
    const deleteConditions = [];

    if (this.supportsRevisions() && this.storageRef.getType() === 'mongodb') {
      const searchConds = {$or: chunkedInstruction.map(x => x.searchCond).filter(x => !isNull(x))};
      const previousEntities = await this.controller.find(this.entityRef.getClassRef().getClass(), searchConds, {raw: true, limit: 0});

      for (const instruction of chunkedInstruction) {
        const instanceRev = instruction.instanceRev;
        const orgId = instruction.orgId;
        const previousEntity = isNull(instruction.searchCond) ? null : find(previousEntities, instruction.searchCond);
        if (previousEntity) {
          const previousEntityRev: IRevisionSupport = <IRevisionSupport><any>previousEntity;
          // check if change happen
          if (previousEntityRev._hash !== instanceRev._hash) {
            // CHANGE
            instanceRev._revNo = previousEntityRev._revNo + 1;
            instanceRev._created = previousEntityRev._created;
            // instanceRev._updated = new Date();

            const newRev = this.entityRevRef.create();
            _.assign(newRev, instanceRev);
            (<any>newRev)._id = [orgId, instanceRev._revNo].join(XS_ID_SEP);

            saveEntities.push(instanceRev, newRev);

            instruction[XS_STATE_KEY] = 'change';

            if (this.revisionLimit() < 0 && instanceRev._revNo > this.revisionLimit()) {
              // Remove revisions
              deleteConditions.push({_orgId: instanceRev._id, _revNo: {$lt: instanceRev._revNo - this.revisionLimit()}});
            }

          } else {
            // NOT CHANGE
            instruction[XS_STATE_KEY] = 'no_change';
          }
        } else {
          // NEW
          // clear previous
          deleteConditions.push({_orgId: instanceRev._id});
          const newRev = this.entityRevRef.create();
          _.assign(newRev, instanceRev);
          (<any>newRev)._id = [orgId, instanceRev._revNo].join(XS_ID_SEP);
          instruction[XS_STATE_KEY] = 'new';
          saveEntities.push(instanceRev, newRev);
        }
        instruction.id = (<any>instruction.instance)._id;

      }

      if (!isEmpty(deleteConditions)) {
        await (this.connection as TypeOrmConnectionWrapper).manager.getMongoRepository(this.entityRevRef.getClassRef().getClass())
          .deleteMany({$or: deleteConditions});
      }

    } else {
      if(chunkedInstruction.length > 0){
        saveEntities.push(...chunkedInstruction.map(x => x.instance));
      }
    }

    if (!isEmpty(saveEntities)) {
      await this.controller.save(saveEntities, this.getOptions());
    }

    return chunkedInstruction;

  }

  // async _doProcess(data: T) {
  //   let searchCond: any = null;
  //   const ref = ClassRef.getGlobal(data.constructor);
  //   const idprops = ref.getPropertyRefs().filter(p => p.isIdentifier());
  //
  //   const instance = this.entityRef.create();
  //   _.assign(instance, data);
  //   let id = idprops.map(id => id.get(instance)).join(':');
  //   if (this.storageRef.getType() === 'mongodb') {
  //
  //     // remove $-fields for save
  //     await TreeHelper.walk(instance, x => {
  //       if (x.key && _.isString(x.key) && ['$'].includes(x.key[0])) {
  //         delete x.parent[x.key];
  //       }
  //     });
  //     searchCond = {};
  //     idprops.forEach(id => {
  //       searchCond[id.storingName] = id.get(instance);
  //     });
  //
  //     // generate _id if not exists!
  //     if (!_.has(instance, '_id')) {
  //       (<any>instance)._id = _.concat([
  //           this.entityRef.getClassRef().storingName],
  //         _.values(searchCond)).join(XS_ID_SEP);
  //     }
  //   }
  //
  //   if (this.supportsRevisions()) {
  //     if (this.storageRef.getType() === 'mongodb') {
  //
  //       const json = JSON.parse(JSON.stringify(instance));
  //       await TreeHelper.walk(json, x => {
  //         if (x.key && _.isString(x.key) && ['_'].includes(x.key[0])) {
  //           delete x.parent[x.key];
  //         }
  //       });
  //
  //       const instanceRev: IRevisionSupport = <IRevisionSupport><any>instance;
  //       const orgId = instanceRev._id;
  //       instanceRev._hash = StorageControllerProcessor.sha1(json);
  //       instanceRev._orgId = orgId;
  //       instanceRev._revNo = 1;
  //       instanceRev._created = new Date();
  //       instanceRev._updated = instanceRev._created;
  //       searchCond['_id'] = orgId;
  //
  //       const previousEntity = await this.controller.findOne(this.entityRef.getClassRef().getClass(),
  //         searchCond, {raw: true});
  //       if (previousEntity) {
  //         const previousEntityRev: IRevisionSupport = <IRevisionSupport><any>previousEntity;
  //         // check if change happen
  //         if (previousEntityRev._hash !== instanceRev._hash) {
  //           // CHANGE
  //           instanceRev._revNo = previousEntityRev._revNo + 1;
  //           instanceRev._created = previousEntityRev._created;
  //           // instanceRev._updated = new Date();
  //
  //           const newRev = this.entityRevRef.create();
  //           _.assign(newRev, instanceRev);
  //           (<any>newRev)._id = [orgId, instanceRev._revNo].join(XS_ID_SEP);
  //
  //           await this.controller.save([instanceRev, newRev], this.getOptions());
  //           (<any>instance)[XS_STATE_KEY] = 'change';
  //
  //           if (this.revisionLimit() < 0 && instanceRev._revNo > this.revisionLimit()) {
  //             // Remove revisions
  //             await (this.connection as TypeOrmConnectionWrapper).manager.getMongoRepository(this.entityRevRef.getClassRef().getClass())
  //               .deleteMany({_orgId: instanceRev._id, _revNo: {$lt: instanceRev._revNo - this.revisionLimit()}});
  //           }
  //
  //         } else {
  //           // NOT CHANGE
  //           (<any>instance)[XS_STATE_KEY] = 'no_change';
  //         }
  //       } else {
  //         // NEW
  //         // clear previous
  //         await (this.connection as TypeOrmConnectionWrapper).manager.getMongoRepository(this.entityRevRef.getClassRef().getClass())
  //           .deleteMany({_orgId: instanceRev._id});
  //
  //         const newRev = this.entityRevRef.create();
  //         _.assign(newRev, instanceRev);
  //         (<any>newRev)._id = [orgId, instanceRev._revNo].join(XS_ID_SEP);
  //         await this.controller.save([instanceRev, newRev], this.getOptions());
  //         (<any>instance)[XS_STATE_KEY] = 'new';
  //       }
  //       id = (<any>instance)._id;
  //     } else {
  //       throw new NotYetImplementedError('only mongodb can have currently revision');
  //     }
  //   } else {
  //     await this.controller.save(instance, this.getOptions());
  //   }
  //
  //   const state = _.get(instance, XS_STATE_KEY, 'none');
  //   this.statistic.count++;
  //   _.set(this.statistic, state, _.get(this.statistic, state, 0) + 1);
  //   this.logger.debug(`storage process ` + this.entityRef.name + ' with id=' + id + ' state=' + state + ' count=' + this.statistic.count);
  //   return instance;
  // }

  async collect() {
    return this.statistic;
  }


}
