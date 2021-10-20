import * as _ from 'lodash';
import {
  IEntityController,
  IFindOptions,
  Injector,
  Storage,
  StorageRef,
  TypeOrmEntityRegistry,
  XS_P_$COUNT,
  XS_P_$OFFSET
} from '@typexs/base';
import { ClassType, IEntityRef } from '@allgemein/schema-api';
import { Reader } from '../../../lib/reader/Reader';
import { IStorageControllerReaderOptions } from '../../../lib/reader/IStorageControllerReaderOptions';


export class StorageControllerReader<T> extends Reader {

  private entityType: ClassType<T>;

  private count: number;

  private offset = 0;

  // private _start: number;

  // private _stop: number;

  private size = 0;

  private _hasNext = true;

  // private schemaName: string;

  private storageName: string;

  private entityRef: IEntityRef;

  private storageController: IEntityController;

  private chunk: T[];


  constructor(options: IStorageControllerReaderOptions<T>) {
    super(StorageControllerReader.name, options);

    this.entityType = options.entityType;
    this.entityRef = TypeOrmEntityRegistry.$().getEntityRefFor(this.entityType);
    // this.schemaName = (<ClassRef>this.entityRef.getClassRef()).getSchema();
    this.storageName = options.storageName;
    const storage = (<Storage>Injector.get(Storage.NAME));
    let ref: StorageRef = null;
    if (this.storageName) {
      ref = storage.get(this.storageName);
    } else {
      ref = storage.forClass(this.entityRef.getClassRef());
    }
    this.storageController = ref.getController();
  }

  doFetch() {
    return this.chunk;
  }


  get chunkSize() {
    return this.getOptions().size;
  }

  async hasNext(): Promise<boolean> {
    await this.find();
    return this._hasNext;
  }

  getOptions(): IStorageControllerReaderOptions<T> {
    return <IStorageControllerReaderOptions<T>>super.getOptions();
  }

  get conditions() {
    return this.getOptions().conditions ? this.getOptions().conditions : null;
  }

  hasMaxLimit() {
    return this.getOptions().maxLimit && this.getOptions().maxLimit > 0;
  }

  getMaxLimit() {
    return this.getOptions().maxLimit;
  }

  getRaw() {
    return _.get(this.getOptions(), 'raw', false);
  }

  async find() {
    // let offset = this.offset;
    let limit = this.getOptions().size;

    if (this.hasMaxLimit()) {
      if (this.size < this.getMaxLimit()) {
        if ((this.size + limit) > this.getMaxLimit()) {
          limit = this.getMaxLimit() - this.size;
        }
      }

      if (this.count > this.getMaxLimit()) {
        this.count = this.getMaxLimit();
      }
    }

    this._hasNext = _.isUndefined(this.count) ? true : this.size < this.count;

    if (limit > 0 && this._hasNext) {

      const findOptions: IFindOptions = {
        offset: this.offset,
        limit: limit,
        raw: this.getRaw()
      };

      if (this.getOptions().sort) {
        findOptions.sort = this.getOptions().sort;
      }

      this.chunk = await this.storageController.find(
        this.entityType, this.conditions, findOptions);
      this.offset = this.chunk[XS_P_$OFFSET];
      this.size = this.size + this.chunk.length;
      // calc next offset
      this.offset = this.offset + this.getOptions().size;
      this.count = this.chunk[XS_P_$COUNT];
    }


  }

}
