// process.env.SQL_LOG = '1';

import { suite } from '@testdeck/mocha';
import { StorageAcontrollerAggregateSqlTemplate } from './storage_controller_aggregate.sql.template';
import { TypeOrmStorageRef } from '../../../src/libs/storage/framework/typeorm/TypeOrmStorageRef';
import { postgres_host, postgres_port } from '../config';

// let bootstrap: Bootstrap;
// let storageRef: StorageRef;
//
// let CarSql: ClassType<any> = null;
// let DriverSql: ClassType<any> = null;
// let CarParam: ClassType<any> = null;
// let controller: StorageEntityController = null;

@suite('functional/storage/controller_aggregate_sql (postgres)')
class StorageControllerAggregatePostgresSpec extends StorageAcontrollerAggregateSqlTemplate {

  static async before() {
    await StorageAcontrollerAggregateSqlTemplate
      .initBefore(
        StorageControllerAggregatePostgresSpec,
        {
          storage: {
            default: {
              synchronize: true,
              type: 'postgres',
              database: 'txsbase',
              username: 'txsbase',
              password: '',
              host: postgres_host,
              port: postgres_port

              // logging: 'all',
              // logger: 'simple-logger'
            }
          }
        });
  }

  static async after() {
    await StorageAcontrollerAggregateSqlTemplate
      .initAfter();
  }


  static async cleanup(ref: TypeOrmStorageRef) {
    const c = await ref.connect();
    await c.query('TRUNCATE car_param RESTART IDENTITY CASCADE;');
    await c.query('TRUNCATE driver_sql  RESTART IDENTITY CASCADE;');
    await c.query('TRUNCATE car_sql  RESTART IDENTITY CASCADE;');
    await c.close();
  }

}

