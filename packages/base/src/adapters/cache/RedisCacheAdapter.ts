import { ICacheAdapter } from '../../libs/cache/ICacheAdapter';
import { CryptUtils, PlatformUtils } from '@allgemein/base';
import { ICacheBinConfig } from '../../libs/cache/ICacheBinConfig';
import { ICacheSetOptions } from '../../libs/cache/ICacheOptions';
import { IRedisCacheClient } from './redis/IRedisCacheClient';
import { Log } from '../../libs/logging/Log';

export class RedisCacheAdapter implements ICacheAdapter {

  static REDIS: any;

  readonly type: string = 'redis';

  client: IRedisCacheClient;

  nodeId = 'global';

  name: string;

  options: ICacheBinConfig;


  async configure(name: string, options: ICacheBinConfig) {
    this.name = name;
    this.options = options;
    this.client = new RedisCacheAdapter.REDIS(this.options);
  }


  async hasRequirements(): Promise<boolean> {
    try {
      await PlatformUtils.loadAsync('redis');
      RedisCacheAdapter.REDIS = await (import('./redis/RedisCacheClient').then(x => x.RedisCacheClient));
      return true;
    } catch (e) {
      Log.debug('Can\'t load redis cache adapter cause redis npm package isn\'t present. ');
    }
    return false;
  }


  private cacheKey(bin: string, key: string) {
    const hash = CryptUtils.shorthash(key);
    return [this.nodeId, 'bin:' + bin, key, hash]
      .join('--')
      .replace(/[^\w\d\-:]/, '');
  }


  /**
   * Get cached value from bin
   *
   * @param key
   * @param bin
   * @param options
   */
  async get(key: string, bin: string, options: ICacheSetOptions): Promise<any> {
    await this.client.connect();
    const _key = this.cacheKey(bin, key);
    return this.client.get(_key, options);
  }


  async set(key: string, value: any, bin: string, options: ICacheSetOptions): Promise<any> {
    await this.client.connect();
    const _key = this.cacheKey(bin, key);
    return this.client.set(_key, value, options);
  }


  async clearBin(name: string) {
    await this.client.connect();
    await this.client.removeKeysByPattern(this.nodeId + '--bin:' + name + '--*');
  }


  async shutdown() {
    await this.client.close();
  }


}
