import {IRuntimeLoaderOptions} from '../base/IRuntimeLoaderOptions';
import {ILoggerOptions} from './logging/ILoggerOptions';
import {IStorageRefOptions} from './storage/IStorageRefOptions';
import {ICacheConfig} from './cache/ICacheConfig';

export interface ITypexsOptions {
  app?: {
    name?: string
    path?: string
  };

  modules?: IRuntimeLoaderOptions;

  logging?: ILoggerOptions;

  storage?: { [name: string]: IStorageRefOptions };

  cache?: ICacheConfig;
}
