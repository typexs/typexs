// process.env.SQL_LOG = '1';

import { suite } from '@testdeck/mocha';
import { StorageAcontrollerAggregateSqlTemplate } from './storage_controller_aggregate.sql.template';
import { TypeOrmStorageRef } from '../../../src/libs/storage/framework/typeorm/TypeOrmStorageRef';

// let bootstrap: Bootstrap;
// let storageRef: StorageRef;
//
// let CarSql: ClassType<any> = null;
// let DriverSql: ClassType<any> = null;
// let CarParam: ClassType<any> = null;
// let controller: StorageEntityController = null;

@suite('functional/storage/controller_aggregate_sql (mysql)')
class StorageControllerAggregateMysqlSpec extends StorageAcontrollerAggregateSqlTemplate {

  static async before() {
    await StorageAcontrollerAggregateSqlTemplate
      .initBefore(StorageControllerAggregateMysqlSpec,
        {
          storage: {
            default: {
              synchronize: true,
              type: 'mysql',
              database: 'txsbase',
              username: 'txsbase',
              password: 'txsbase',
              host: '127.0.0.1',
              port: 3306,
              // logging: 'all',
              // logger: 'simple-console'
            }
          }
        }
      );


  }

  static async after() {
    await StorageAcontrollerAggregateSqlTemplate
      .initAfter();
  }


  static async cleanup(ref: TypeOrmStorageRef) {
    const c = await ref.connect();
    await c.manager.query('SET FOREIGN_KEY_CHECKS = 0');
    // await c.manager.query(
    //   'SET GLOBAL sql_mode=\'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,' +
    //   'NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION\'');
    await c.manager.query('TRUNCATE TABLE  car_param');
    await c.manager.query('TRUNCATE TABLE  car_sql');
    await c.manager.query('TRUNCATE TABLE  driver_sql');
    await c.manager.query('SET FOREIGN_KEY_CHECKS = 1');
    await c.close();
  }

  // static async init(ref: TypeOrmStorageRef) {
  //
  //   const c = await ref.connect();
  //   await c.manager.query(
  //     'SET GLOBAL sql_mode=\'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,' +
  //     'NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION\'');
  //   await c.close();
  // }

}

