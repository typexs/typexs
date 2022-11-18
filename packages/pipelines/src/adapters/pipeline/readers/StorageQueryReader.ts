import { IFindOptions, Injector, IStorageRef, Storage } from '@typexs/base';
import { isFunction, isNumber } from 'lodash';
import { IReaderOptions } from '../../../lib/reader/IReaderOptions';
import { Reader } from '../../../lib/reader/Reader';
import { NotSupportedError } from '@allgemein/base';


export interface IStorageQueryReaderOptions<T> extends IReaderOptions, IFindOptions {

  /**
   * Name of the storage backend
   */
  storageName: string;

  /**
   * Raw DB query for the storage backend
   */
  rawQuery?: string | object | Function;

}


export class StorageQueryReader<T> extends Reader {


  private count: number;

  private offset = 0;

  private fetchInc = 0;

  private inc = 0;

  private size = 0;

  private _hasNext = true;

  private storageRef: IStorageRef;

  private storageName: string;

  // private chunk: T[];

  // private records: any[];

  constructor(options: IStorageQueryReaderOptions<T>) {
    super(StorageQueryReader.name, options);
    this.storageName = options.storageName;
    const storage = (<Storage>Injector.get(Storage.name));
    if (this.storageName) {
      this.storageRef = storage.get(this.storageName);
    } else {
      throw new Error('storage name not present');
    }
  }

  doInit() {
    // TODO check if ratinal DB
  }

  getQuery(): Promise<string> {
    const rawQuery = this.getOptions().rawQuery;
    if (rawQuery) {
      if (isFunction(rawQuery)) {
        if (rawQuery.length === 1) {
          return rawQuery(this);
        } else {
          return rawQuery();
        }
      } else {
        return Promise.resolve(rawQuery as string);
      }
    } else {
      return this.getConditions();
    }
  }

  async doFetch() {
    let query = await this.getQuery();
    const limit = this.getOptions().size;
    const offset = (limit * this.fetchInc);
    let results = [];
    // TODO let this be handled in future by adapter in typexs/base
    if (this.storageRef.getType() === 'postgres') {
      query = query + ' OFFSET ' + offset + ' LIMIT ' + limit;
    } else if (this.storageRef.getType() === 'aios') {
      query = query.replace(/(select)/i, '$1 skip ' + offset + ' first ' + limit);
    } else {
      throw new NotSupportedError('Storage type ' + this.storageRef.getType() + ' currently not supported ');
    }
    let error = null;
    const c = await this.storageRef.connect();
    try {
      results = await c.query(query);
      if (results.length === 0) {
        this._hasNext = false;
      } else {
        this.inc += results.length;
      }
    } catch (e) {
      error = e;
    } finally {
      await c.close();
    }
    if (error) {
      throw error;
    }

    this.fetchInc++;

    return results;
  }


  get chunkSize() {
    return this.getOptions().size;
  }

  async hasNext(): Promise<boolean> {

    if (!isNumber(this.count)) {
      await this.executeCount();
    }
    if (this._hasNext) {
      const limit = this.getOptions().size;
      if (this.count > -1) {
        this._hasNext = this.fetchInc * limit < this.count;
      }
    }

    return this._hasNext;
  }

  getOptions(): IStorageQueryReaderOptions<T> {
    return <IStorageQueryReaderOptions<T>>super.getOptions();
  }


  async executeCount() {
    const c = await this.storageRef.connect();
    try {
      const count = await c.query('SELECT COUNT(*) cnt FROM (' + this.getOptions().rawQuery + ')');
      if (count.length === 1) {
        this.count = count.shift().cnt;
      } else {
        this.count = -1;
      }
    } catch (e) {
      this.count = -1;
    } finally {
      await c.close();
    }
  }

  //
  // async find() {
  //   // if (isUndefined(this.records)) {
  //   //   const c = await this.storageRef.connect() as TypeOrmConnectionWrapper;
  //   //   this.records = await c.manager.query(this.getOptions().rawQuery);
  //   //   this.count = this.records.length;
  //   //   await c.close();
  //   // }
  //
  //   const limit = this.getOptions().size;
  //   // this._hasNext = !isEmpty(this.records);
  //   if (this._hasNext) {
  //     // this.offset = this.chunk[XS_P_$OFFSET];
  //     // this.size = this.size + this.chunk.length;
  //     // calc next offset
  //     // this.offset = this.offset + this.getOptions().size;
  //
  //
  //     this.chunk = this.records.splice(0, limit);
  //   }
  //
  //
  // }

}
