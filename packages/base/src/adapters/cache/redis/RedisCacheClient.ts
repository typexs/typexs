import { isBuffer, isEmpty, isNull, isUndefined } from '@typexs/generic';
import { createClient, RedisClientType, SetOptions } from 'redis';
import { IRedisCacheClient } from './IRedisCacheClient';
import { ICacheGetOptions, ICacheSetOptions } from '../../../libs/cache/ICacheOptions';
import { Serializer } from '@allgemein/base';
import { IRedisCacheOptions } from './IRedisCacheOptions';
import { Log } from '../../../libs/logging/Log';


export class RedisCacheClient implements IRedisCacheClient {

  options: IRedisCacheOptions;

  client: RedisClientType;

  private connected = false;


  constructor(options: IRedisCacheOptions) {
    this.options = options || { host: 'localhost', port: 6379 };

    let url = this.options.url;
    if (!url) {
      // redis://alice:foobared@awesome.redis.server:6380
      let host = '';
      if (this.options.host) {
        host += this.options.host;
      } else {
        host += 'localhost';
      }

      if (this.options.port) {
        host += ':' + this.options.port;
      } else {
        host += ':6379';
      }

      let user = '';
      if (this.options.username && this.options.password) {
        user += this.options.username + ':' + this.options.password;
      }

      if (user) {
        url = 'redis://' + user + '@' + host;
      } else {
        url = 'redis://' + host;
      }

      this.options.url = url;
    }

    if (!this.options.socket) {
      this.options.socket = {};
    }

    if (!this.options.socket.connectTimeout) {
      this.options.socket.connectTimeout = 5000;
    }
  }


  async connect(): Promise<IRedisCacheClient> {
    if (this.connected) {
      return Promise.resolve(this);
    }

    this.client = createClient(this.options) as RedisClientType;
    this.client.on('error', err => Log.error('Redis Client Error', err));
    try {
      this.client = await this.client.connect();
      if (this.options.unref !== false) {
        this.client.unref();
      }
      this.connected = true;
      return this;
    } catch (e) {
      this.client = undefined;
      throw e;
    }
  }


  async get(key: string, options?: ICacheGetOptions) {
    let reply = await this.client.get(key);
    if (isBuffer(reply)) {
      reply = reply.toString();
    }
    return this.unserialize(reply);
  }

  serialize(v: any) {
    try {
      return Serializer.serialize(v);
    } catch (e) {
      return null;
    }
  }

  unserialize(v: any) {
    try {
      return Serializer.deserialize(v);
    } catch (e) {
      return null;
    }

  }

  set(key: string, value: any, options?: ICacheSetOptions) {
    if (!this.client || !this.connected) {
      throw new Error('no connection');
    }

    if (isNull(value) || isUndefined(value)) {
      return this.client.del(key);
    } else {
      const _value = this.serialize(value);
      let ret = null;
      if (options && options.ttl) {
        const setOptions: SetOptions = {};
        if (options.ttl % 1000 === 0) {
          setOptions.EX = Math.round(options.ttl / 1000);
        } else {
          setOptions.PX = options.ttl;
        }
        ret = this.client.set(key, _value, setOptions);
      } else {
        ret = this.client.set(key, _value);
      }
      return ret;
    }
  }


  /**
   * Remove keys by given pattern (wildcard is *)
   * @param name
   */
  async removeKeysByPattern(name: string): Promise<number> {
    const reply = await this.client.keys(name);
    if (!isEmpty(reply)) {
      const reply1 = await this.client.del(reply);
      return reply1;
    } else {
      return 0;
    }
  }


  /**
   * Close connection to redis
   */
  close() {
    if (this.connected) {
      if (this.client.isOpen) {
        return this.client.quit()
          .then(x => {
            this._reset();
            return x;
          })
          .catch(err => {
            this._reset();
            throw err;
          });
      } else {
        this._reset();
      }
    }
    return null;
  }

  private _reset() {
    this.connected = false;
    if (this.client) {
      this.client.removeAllListeners();
      this.client = null;
    }
  }
}
