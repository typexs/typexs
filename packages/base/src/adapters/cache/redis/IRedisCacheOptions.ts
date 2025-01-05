import { RedisClientOptions } from 'redis';

export interface IRedisCacheOptions extends RedisClientOptions {

  host: string;

  port: number;

  unref?: boolean;

}
