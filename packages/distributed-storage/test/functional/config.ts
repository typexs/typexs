import { SqliteConnectionOptions } from 'typeorm/driver/sqlite/SqliteConnectionOptions';
import { MongoConnectionOptions } from 'typeorm/driver/mongodb/MongoConnectionOptions';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { IStorageOptions } from '@typexs/base';
import { TestHelper } from '@typexs/testing';

export const SPAWN_TIMEOUT = 120000;

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
    synchronize: true,
    connectOnStartup: true,
    logger: 'simple-console',
    logging: 'all'
  } :
  <MongoConnectionOptions & IStorageOptions>{
    name: 'default',
    type: 'mongodb',
    database: 'typexs',
    synchronize: true,
    connectOnStartup: true
  };


export const TEST_PSQL_STORAGE_OPTIONS: IStorageOptions = process.env.SQL_LOG ?
  <PostgresConnectionOptions & IStorageOptions>{
    name: 'default',
    type: 'postgres',
    host: 'localhost',
    port: 5436,
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
    host: 'localhost',
    port: 5436,
    database: 'txsbase',
    username: 'txsbase',
    synchronize: true,
    connectOnStartup: true
  };
