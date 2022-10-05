import { get } from 'lodash';
import {IStorageRefOptions} from '@typexs/base';
import {SqliteConnectionOptions} from 'typeorm/driver/sqlite/SqliteConnectionOptions';

let inc = 0;
export const LOGGING = {
  enable: false,
  level: 'debug',
  transports: [{console: {name: 'logger' + (inc++)}}]

};

export const postgres_auth_host = get(process.env, 'POSTGRES_AUTH_HOST', 'localhost');
export const postgres_auth_port = get(process.env, 'POSTGRES_AUTH_PORT', 5437);



export const ldap_host = get(process.env, 'LDAP_HOST', 'localhost');
export const ldap_port = get(process.env, 'LDAP_PORT', 389);
export const ldaps_port = get(process.env, 'LDAPS_PORT', 689);


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
  connectOnStartup: true,

};
