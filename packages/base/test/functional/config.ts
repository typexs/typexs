import {SqliteConnectionOptions} from 'typeorm/driver/sqlite/SqliteConnectionOptions';
import {IStorageOptions} from '../../src/libs/storage/IStorageOptions';
import {MongoConnectionOptions} from 'typeorm/driver/mongodb/MongoConnectionOptions';
import {PostgresConnectionOptions} from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { get } from 'lodash';

export const redis_host = get(process.env, 'REDIS_HOST', 'localhost');
export const redis_port = get(process.env, 'REDIS_PORT', 6973);

export const redis2_host = get(process.env, 'REDIS2_HOST', 'localhost');
export const redis2_port = get(process.env, 'REDIS2_PORT', 6973);

export const mongodb_host = get(process.env, 'MONGODB_HOST', 'localhost');
export const mongodb_port = get(process.env, 'MONGODB_PORT', 27018);

export const postgres_host = get(process.env, 'POSTGRES_HOST', 'localhost');
export const postgres_port = get(process.env, 'POSTGRES_PORT', 5436);



export const SPAWN_TIMEOUT = 120000;

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
    connectOnStartup: true,
  };


export const TEST_MONGO_STORAGE_OPTIONS: IStorageOptions = process.env.SQL_LOG ?
  <MongoConnectionOptions & IStorageOptions>{
    name: 'default',
    type: 'mongodb',
    host: mongodb_host,
    port: mongodb_port,
    database: 'typexs',
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
    connectOnStartup: true,
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
    connectOnStartup: true,
  };
