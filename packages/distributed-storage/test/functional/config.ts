import { SqliteConnectionOptions } from 'typeorm/driver/sqlite/SqliteConnectionOptions';
import { MongoConnectionOptions } from 'typeorm/driver/mongodb/MongoConnectionOptions';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { IStorageOptions } from '@typexs/base';
import { TestHelper } from '@typexs/testing';
import { get } from 'lodash';

export const SPAWN_TIMEOUT = 120000;
export const redis_host = get(process.env, 'REDIS_HOST', 'localhost');
export const redis_port = get(process.env, 'REDIS_PORT', 6379);

export const redis2_host = get(process.env, 'REDIS2_HOST', 'localhost');
export const redis2_port = get(process.env, 'REDIS2_PORT', 6380);

export const mongodb_host = get(process.env, 'MONGODB_HOST', 'localhost');
export const mongodb_port = get(process.env, 'MONGODB_PORT', 27017);

export const postgres_host = get(process.env, 'POSTGRES_HOST', 'localhost');
export const postgres_port = get(process.env, 'POSTGRES_PORT', 5436);

export const mysql_host = get(process.env, 'MYSQL_HOST', 'localhost');
export const mysql_port = get(process.env, 'MYSQL_PORT', 3306);
export const MODUL_CONFIG = {
  paths: [
    TestHelper.root()
  ],
  include: [
    '**/@allgemein{,/eventbus}*',
    '**/@typexs{,/base}*',
    '**/@typexs{,/distributed-storage}*',
    '**/fake_app**'
  ],
  disableCache: true
};

export const TEST_STORAGE_OPTIONS: IStorageOptions = process.env.SQL_LOG ?
  <SqliteConnectionOptions & IStorageOptions>{
    name: 'default',
    type: 'sqlite',
    database: ':memory:',
    synchronize: true,
    connectOnStartup: true,
    logger: 'simple-console',
    logging: 'all'
  } :
  <SqliteConnectionOptions & IStorageOptions>{
    name: 'default',
    type: 'sqlite',
    database: ':memory:',
    synchronize: true,
    connectOnStartup: true
  };


export const TEST_MONGO_STORAGE_OPTIONS: IStorageOptions = process.env.SQL_LOG ?
  <MongoConnectionOptions & IStorageOptions>{
    name: 'default',
    type: 'mongodb',
    database: 'typexs',
    host: mongodb_host,
    port: mongodb_port,
    synchronize: true,
    connectOnStartup: true,
    logger: 'simple-console',
    logging: 'all'
  } :
  <MongoConnectionOptions & IStorageOptions>{
    name: 'default',
    type: 'mongodb',
    host: mongodb_host,
    port: mongodb_port,
    database: 'typexs',
    synchronize: true,
    connectOnStartup: true
  };


export const TEST_PSQL_STORAGE_OPTIONS: IStorageOptions = process.env.SQL_LOG ?
  <PostgresConnectionOptions & IStorageOptions>{
    name: 'default',
    type: 'postgres',
    host: postgres_host,
    port: postgres_port,
    database: 'txsbase',
    username: 'txsbase',
    synchronize: true,
    connectOnStartup: true,
    logger: 'simple-console',
    logging: 'all'
  } :
  <PostgresConnectionOptions & IStorageOptions>{
    name: 'default',
    type: 'postgres',
    host: postgres_host,
    port: postgres_port,
    database: 'txsbase',
    username: 'txsbase',
    synchronize: true,
    connectOnStartup: true
  };
