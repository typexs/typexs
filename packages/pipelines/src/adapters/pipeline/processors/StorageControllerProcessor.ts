import * as _ from 'lodash';
import {IProcessorOptions, Processor} from '../../../lib/Processor';
import sha1 from 'sha1';
import {XS_ID_SEP, XS_STATE_KEY} from '../../../lib/Constants';
import {IRevisionSupport} from '../../../lib/IRevisionSupport';
import {ClassRef, ClassType, IEntityRef} from '@allgemein/schema-api';
import {
  IEntityController,
  Injector,
  ISaveOptions,
  NotYetImplementedError,
  Storage,
  StorageRef,
  TypeOrmConnectionWrapper,
  TypeOrmEntityRegistry
} from '@typexs/base';
import {TreeUtils} from '@allgemein/base';

export interface IStorageControllerProcessorOptions<T> extends IProcessorOptions, ISaveOptions {

  storageName?: string;
  targetType: ClassType<T>;
  targetRevType?: ClassType<T>;
  revisionLimit?: number;
  // revisions?: boolean

}

export class StorageControllerProcessor<T> extends Processor {

  constructor(opts: IStorageControllerProcessorOptions<T>) {
    super(_.defaults(opts, {revisions: false, revisionLimit: 5}));

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

  connection: TypeOrmConnectionWrapper;

  storageName: string;

  storageRef: StorageRef;

  entityRef: IEntityRef;

  entityRevRef: IEntityRef;

  controller: IEntityController;

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
    this.connection = await this.storageRef.connect() as TypeOrmConnectionWrapper;
    // TODO
    this.statistic.processor = StorageControllerProcessor.name;
    this.statistic.entityRef = this.entityRef.name;
  }


  async doFinish() {
    await this.connection.close();
    return this.statistic;
  }


  supportsRevisions() {
    return !_.isNull(this.entityRevRef) && !_.isUndefined(this.entityRevRef);
  }


  getOptions(): IStorageControllerProcessorOptions<T> {
    return <any>this.$options;
  }


  async doProcess(data: T) {
    const instance = this.entityRef.create();
    _.assign(instance, data);
    let searchCond: any = null;
    const ref = ClassRef.get(data.constructor);
    const idprops = ref.getPropertyRefs().filter(p => p.isIdentifier());
    let id = idprops.map(id => id.get(instance)).join(':');
    if (this.storageRef.getType() === 'mongodb') {
      // generate _id if not exists!

      searchCond = {};
      idprops.forEach(id => {
        searchCond[id.storingName] = id.get(instance);
      });

      if (!_.has(instance, '_id')) {
        (<any>instance)._id = _.concat([
          this.entityRef.getClassRef().storingName],
        _.values(searchCond)).join(XS_ID_SEP);
      }
    }

    if (this.supportsRevisions()) {
      if (this.storageRef.getType() === 'mongodb') {
        const json = JSON.parse(JSON.stringify(instance));
        TreeUtils.walk(json, x => {
          if (x.key && _.isString(x.key) && x.key[0] === '_') {
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
        searchCond['_id'] = orgId;

        const previousEntity = await this.controller.findOne(this.entityRef.getClassRef().getClass(),
          searchCond, {raw: true});
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

            await this.controller.save([instanceRev, newRev], this.getOptions());
            (<any>instance)[XS_STATE_KEY] = 'change';

            if (this.revisionLimit() < 0 && instanceRev._revNo > this.revisionLimit()) {
              // Remove revisions
              await this.connection.manager.getMongoRepository(this.entityRevRef.getClassRef().getClass())
                .deleteMany({_orgId: instanceRev._id, _revNo: {$lt: instanceRev._revNo - this.revisionLimit()}});
            }

          } else {
            // NOT CHANGE
            (<any>instance)[XS_STATE_KEY] = 'no_change';
          }
        } else {
          // NEW
          // clear previous
          await this.connection.manager.getMongoRepository(this.entityRevRef.getClassRef().getClass())
            .deleteMany({_orgId: instanceRev._id});

          const newRev = this.entityRevRef.create();
          _.assign(newRev, instanceRev);
          (<any>newRev)._id = [orgId, instanceRev._revNo].join(XS_ID_SEP);
          await this.controller.save([instanceRev, newRev], this.getOptions());
          (<any>instance)[XS_STATE_KEY] = 'new';
        }
        id = (<any>instance)._id;
      } else {
        throw new NotYetImplementedError('only mongodb can have currently revision');
      }
    } else {
      await this.controller.save(instance, this.getOptions());
    }

    const state = _.get(instance, XS_STATE_KEY, 'none');
    this.statistic.count++;
    _.set(this.statistic, state, _.get(this.statistic, state, 0) + 1);
    this.logger.info('storage process ' + this.entityRef.name + ' with id=' + id + ' state=' + state + ' count=' + this.statistic.count);
    return instance;
  }

  async collect() {
    return this.statistic;
  }


}
