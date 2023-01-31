import { CLS_DEF, IEntityController, NotYetImplementedError } from '@typexs/base';
import { ElasticStorageRef } from './ElasticStorageRef';
import { ElasticConnection } from './ElasticConnection';
import { SaveOp } from './ops/SaveOp';
import { FindOp } from './ops/FindOp';
import { IElasticAggregateOptions } from './ops/IElasticAggregateOptions';
import { IElasticFindOptions } from './ops/IElasticFindOptions';
import { IElasticDeleteOptions } from './ops/IElasticDeleteOptions';
import { IElasticSaveOptions } from './ops/IElasticSaveOptions';
import { IElasticUpdateOptions } from './ops/IElasticUpdateOptions';
import { DeleteOp } from './ops/DeleteOp';
import { IndexEntityRef } from '../registry/IndexEntityRef';
import { isString } from 'lodash';

export class ElasticEntityController implements IEntityController {

  private readonly storageRef: ElasticStorageRef;

  connection: ElasticConnection;


  constructor(storageRef: ElasticStorageRef) {
    this.storageRef = storageRef;
  }

  getInvoker() {
    return this.storageRef.getInvoker();
  }

  aggregate<T>(baseClass: CLS_DEF<T>, pipeline: any[], options?: IElasticAggregateOptions): Promise<any[]> {
    throw new NotYetImplementedError('aggregate for elastic controller is currently not implemented');
  }

  find<T>(fn: CLS_DEF<T> | CLS_DEF<T>[], conditions?: any, options?: IElasticFindOptions): Promise<T[]> {
    return new FindOp<T>(this).run(fn as any, conditions, options);
  }

  findOne<T>(fn: CLS_DEF<T>, conditions?: any, options?: IElasticFindOptions): Promise<T> {
    return this.find<T>(fn, conditions, options).then(r => r.length > 0 ? r.shift() : null);
  }

  // forClass(cls: CLS_DEF<any> | IClassRef): IndexEntityRef | IndexEntityRef[] {
  forClass(cls: CLS_DEF<any>): any {
    if (isString(cls) && cls === '*') {
      return this.storageRef.getEntityRefs();
    }
    if (this.storageRef.hasEntityClass(cls)) {
      return this.storageRef.getEntityRef(cls as any);
    }
    return null;
  }

  forIndexType(cls: CLS_DEF<any>): any {
    if (this.storageRef.hasEntityClass(cls, true)) {
      return this.storageRef.getEntityRef(cls as any, true);
    }
    return null;
  }

  name(): string {
    return this.storageRef.name;
  }

  entityIdQuery(entityRef: IndexEntityRef, value: any): any {
    return {
      _id: value
    };
  }

  /**
   * Returns the reference to handled storage
   */
  getStorageRef() {
    return this.storageRef;
  }

  remove<T>(object: T[] | T, options?: IElasticDeleteOptions): Promise<number>;
  // eslint-disable-next-line no-dupe-class-members
  remove<T>(cls: CLS_DEF<T>, condition?: any, options?: IElasticDeleteOptions): Promise<number>;
  // eslint-disable-next-line no-dupe-class-members
  remove<T>(object: any, condition?: any, options?: IElasticDeleteOptions): Promise<number> {
    return new DeleteOp<T>(this).run(object, condition, options);
    // return null;
  }

  save<T>(object: T, options?: IElasticSaveOptions): Promise<T>;
  // eslint-disable-next-line no-dupe-class-members
  save<T>(object: T[], options?: IElasticSaveOptions): Promise<T[]>;
  // eslint-disable-next-line no-dupe-class-members
  save<T>(object: any, options?: IElasticSaveOptions): Promise<T | T[]> {
    return new SaveOp<T>(this).run(object, options);
  }

  update<T>(cls: CLS_DEF<T>, condition: any, update: any, options?: IElasticUpdateOptions): Promise<number> {
    // return new UpdateOp<T>(this).run(cls, condition, update, options);
    throw new NotYetImplementedError('update by query for elastic controller is currently not implemented');
    // return Promise.resolve(0);
  }

  /**
   * Refresh index names
   *
   * @param indexNames
   */
  refresh(indexNames: string[]) {
    return this.getStorageRef().refresh(indexNames);
  }


  async connect() {
    if (this.connection) {
      if (!this.connection.isOpened()) {
        await this.connection.close();
        this.connection = await this.storageRef.connect();
      } else {
        this.connection.usageInc();
      }
    } else {
      this.connection = await this.storageRef.connect();
    }
    return this.connection;
  }

  async close() {
    if (this.connection) {
      this.connection.usageDec();
      if (this.connection.getUsage() <= 0) {
        await this.connection.close();
        this.connection = null;
      }
    }
  }

}
