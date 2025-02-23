import { Connection } from 'typeorm';
import { IConnection } from '../../IConnection';
import { TypeOrmStorageRef } from './TypeOrmStorageRef';
import { Log } from '../../../logging/Log';
import { EVENT_STORAGE_REF_PREPARED } from './Constants';
import { LockFactory, Semaphore } from '@allgemein/base';
import { IObjectHandle } from '../IObjectHandle';
import { RepositoryWrapper } from './RepositoryWrapper';
import { EntityType } from '../Constants';
import { has, isNumber } from '@typexs/generic';


export class TypeOrmConnectionWrapper implements IConnection {

  static $INC = 0;

  private static _LOCK: { [k: string]: Semaphore } = {};

  usage: number = 0;

  inc: number = TypeOrmConnectionWrapper.$INC++;

  private name: string = null;

  storageRef: TypeOrmStorageRef;

  _connection: Connection;

  _fn: any;

  locking: boolean = false;

  semaphore: {
    read: Semaphore;
    write: Semaphore;
  } = { read: null, write: null };


  constructor(s: TypeOrmStorageRef, conn?: Connection) {
    this.locking = s.isSingleConnection();
    const options = s.getOptions();
    if (options) {
      if (options.connection) {
        if (isNumber(options.connection.read) && options.connection.read > 0) {
          this.semaphore.read = new Semaphore(options.connection.read);
        }
        if (isNumber(options.connection.write) && options.connection.write > 0) {
          this.semaphore.write = new Semaphore(options.connection.write);
        }
      }
    }
    this.storageRef = s;
    this._connection = conn;
    this.name = this.storageRef.name;
  }

  acquire(mode: 'read' | 'write') {
    if (this.semaphore[mode]) {
      return this.semaphore[mode].acquire();
    }
    return null;
  }

  release(mode: 'read' | 'write') {
    if (this.semaphore[mode]) {
      return this.semaphore[mode].release();
    }
    return null;
  }

  initialize() {
    this._fn = () => {
      this.reload();
    };
    this.storageRef.on(EVENT_STORAGE_REF_PREPARED, this._fn);
  }


  async reload() {
    const connected = !!this._connection && this._connection.isConnected;
    this.reset();
    if (connected) {
      this.usageDec();
      await this.connect();
    }
  }


  destroy() {
    this.reset();
    if (this._fn) {
      this.storageRef.off(EVENT_STORAGE_REF_PREPARED, this._fn);
    }
  }


  /**
   * Method for generic queries
   *
   * @param query
   * @param parameters
   */
  query(query: any, parameters?: any[]): Promise<any[]> {
    return this.getEntityManager().query(query, parameters);
  }

  get connection() {
    if (!this._connection) {
      this._connection = this.getStorageRef().getConnection();
    }
    return this._connection;
  }


  reset() {
    this._connection = null;
  }


  get lock() {
    if (!has(TypeOrmConnectionWrapper._LOCK, this.name)) {
      TypeOrmConnectionWrapper._LOCK[this.name] = LockFactory.$().semaphore(1);
    }
    return TypeOrmConnectionWrapper._LOCK[this.name];
  }


  getStorageRef() {
    return this.storageRef;
  }


  usageInc() {
    return ++this.usage;
  }


  usageDec() {
    if (this.usage > 0) {
      return --this.usage;
    }
    return this.usage;
  }


  getUsage() {
    return this.usage;
  }


  /**
   * Is the connection opened
   */
  isOpened() {
    return this._connection && this._connection.isConnected;
  }

  /**
   * Check if underlying datasource supports multiple connection
   */
  isSingleConnection(): boolean {
    return this.storageRef.isSingleConnection();
  }


  isOnlyMemory(): boolean {
    return this.storageRef.isOnlyMemory();
  }


  async connect(): Promise<TypeOrmConnectionWrapper> {
    if (this.getUsage() <= 0 || !this.isOpened()) {
      if (this.locking) {
        await this.lock.acquire();
      }
      try {
        const connection = this.connection;
        if (!connection.isConnected) {
          await this.connection.connect();
        }
        this.usageInc();
      } catch (err) {
        Log.error(err);
      } finally {
        if (this.locking) {
          this.lock.release();
        }
      }
    } else {
      this.usageInc();
    }
    return this;
  }


  async close(): Promise<IConnection> {
    const rest = this.usageDec();
    if (rest <= 0) {
      if (this.locking) {
        await this.lock.acquire();
      }
      try {
        await this.storageRef.remove(this);
        this.destroy();
      } catch (err) {
        Log.error(err);
      } finally {
        if (this.locking) {
          this.lock.release();
        }
      }
    }
    return this;
  }


  /**
   * Return typeorm entity manager
   */
  getEntityManager() {
    return this.connection.manager;
  }


  /**
   * Method wrapping object type specific operations
   *
   * @param entityType
   */
  for<T>(entityType: EntityType<T>): IObjectHandle<T> {
    return new RepositoryWrapper(this, entityType);
  }
}
