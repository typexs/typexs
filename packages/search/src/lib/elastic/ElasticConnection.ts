import {IConnection, Log} from '@typexs/base';
import {Client, ClientOptions} from '@elastic/elasticsearch';
import {ElasticStorageRef} from './ElasticStorageRef';

export class ElasticConnection implements IConnection {

  static $INC = 0;

  inc: number = ElasticConnection.$INC++;

  // TODO is this necessary to keep this
  private storageRef: ElasticStorageRef;

  private client: Client;

  private lastPing: Date;


  usage: number = 0;

  private options: ClientOptions;

  private connected: boolean = false;


  constructor(storageRef: ElasticStorageRef, options: ClientOptions) {
    this.storageRef = storageRef;
    this.options = options;
  }

  get name() {
    return this.storageRef.getName();
  }

  async ping(): Promise<any> {
    return this.client.ping({});
  }

  getClient(): Client {
    return this.client;
  }

  async close(): Promise<IConnection> {
    const rest = this.usageDec();
    if (rest <= 0) {
      try {
        await this.storageRef.remove(this);
        await this.destroy();
      } catch (err) {
        Log.error(err);
      } finally {
      }
    }
    return Promise.resolve(this);
  }

  async connect(): Promise<IConnection> {
    if (this.getUsage() <= 0) {
      try {
        if (!this.client) {
          this.client = new Client(this.options);
          await this.ping();
          this.connected = true;
        }
        this.usageInc();
      } catch (err) {
        Log.error(err);
      }
    } else {
      this.usageInc();
    }
    return Promise.resolve(this);
  }


  async destroy() {
    if (this.client) {
      await this.client.close();
      this.client = null;
    }
    this.connected = false;
  }

  // get lock() {
  //   if (!_.has(ElasticConnection._LOCK, this.name)) {
  //     ElasticConnection._LOCK[this.name] = LockFactory.$().semaphore(1);
  //   }
  //   return ElasticConnection._LOCK[this.name];
  // }


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

  isOpened() {
    return this.connected;
  }


}
