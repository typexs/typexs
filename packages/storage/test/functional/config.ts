import { IStorageRefOptions } from '@typexs/base';
import { SqliteConnectionOptions } from 'typeorm/driver/sqlite/SqliteConnectionOptions';

export const TEST_STORAGE_OPTIONS: IStorageRefOptions = process.env.SQL_LOG ? <SqliteConnectionOptions & IStorageRefOptions>{
  name: 'default',
  type: 'sqlite',
  database: ':memory:',
  synchronize: true,
  connectOnStartup: true,
  logger: 'simple-console',
  logging: 'all'
  // tablesPrefix: ""

} : <SqliteConnectionOptions & IStorageRefOptions>{
  name: 'default',
  type: 'sqlite',
  database: ':memory:',
  synchronize: true,
  connectOnStartup: true

};
