
import {SqliteConnectionOptions} from "typeorm/driver/sqlite/SqliteConnectionOptions";
import {IStorageOptions} from "@typexs/base";
import { get } from 'lodash';
export const redis_host = get(process.env, 'REDIS_HOST', 'localhost');
export const redis_port = get(process.env, 'REDIS_PORT', 6379);
export const TEST_STORAGE_OPTIONS: IStorageOptions = process.env.SQL_LOG ? <SqliteConnectionOptions & IStorageOptions>{
  name: 'default',
  type: "sqlite",
  database: ":memory:",
  synchronize: true,
  connectOnStartup: true,
  logger: "simple-console",
  logging: "all"
  // tablesPrefix: ""

} : <SqliteConnectionOptions & IStorageOptions>{
  name: 'default',
  type: "sqlite",
  database: ":memory:",
  synchronize: true,
  connectOnStartup: true,

};
