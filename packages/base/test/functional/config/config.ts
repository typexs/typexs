import { IEventBusConfiguration } from '@allgemein/eventbus';
import { redis2_host, redis2_port, redis_host, redis_port } from '../config';

export const EVENTBUS_CONFIG = {
  default: <IEventBusConfiguration>{
    adapter: 'redis',
    extra: {
      host: redis_host,
      port: redis_port,
      unref: true
    }
  }
};

export const CACHE_CONFIG = {
  bins: {
    default: 'redis1'
  },
  adapter: {
    redis1: {
      type: 'redis',
      host: redis_host,
      port: redis_port,
      unref: true
    }
  }
};

export const CACHE2_CONFIG = {
  bins: {
    default: 'redis1'
  },
  adapter: {
    redis1: {
      type: 'redis',
      host: redis2_host,
      port: redis2_port,
      unref: true
    }
  }
};
