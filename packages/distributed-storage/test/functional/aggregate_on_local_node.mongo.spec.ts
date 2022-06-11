import { expect } from 'chai';
import { suite, test } from '@testdeck/mocha';
import { Bootstrap } from '@typexs/base/Bootstrap';
import { Config } from '@allgemein/config';
import { MODUL_CONFIG, TEST_MONGO_STORAGE_OPTIONS } from './config';
import { IEventBusConfiguration } from '@allgemein/eventbus';
import { TestHelper } from '@typexs/testing';

import { ITypexsOptions } from '@typexs/base/libs/ITypexsOptions';
import { DataRow } from './fake_app_mongo/entities/DataRow';
import * as _ from 'lodash';
import { Injector } from '@typexs/base/libs/di/Injector';
import { __NODE_ID__, C_STORAGE_DEFAULT } from '@typexs/base/libs/Constants';
import { StorageRef } from '@typexs/base/libs/storage/StorageRef';
import { generateMongoDataRows } from './helper';
import { getMetadataArgsStorage } from 'typeorm';
import { DistributedStorageEntityController } from '../../src/lib/DistributedStorageEntityController';


const LOG_EVENT = TestHelper.logEnable(false);

let bootstrap: Bootstrap;

// let p: SpawnHandle;


@suite('functional/distributed_storage/aggregate_on_local_node (mongo)')
class DistributedStorageSaveSpec {


  static async before() {
    Bootstrap.reset();
    Config.clear();
    const DB_OPTIONS = TEST_MONGO_STORAGE_OPTIONS;
    _.set(DB_OPTIONS, 'database', 'typexs_local');
    const config = <ITypexsOptions & any>{
      app: { name: 'test', nodeId: 'system', path: __dirname + '/fake_app' },
      logging: { enable: LOG_EVENT, level: 'debug' },
      modules: MODUL_CONFIG,
      storage: { default: DB_OPTIONS },
      eventbus: { default: <IEventBusConfiguration>{ adapter: 'redis', extra: { host: '127.0.0.1', port: 6379, unref: true } } },
      workers: { access: [{ name: 'DistributedQueryWorker', access: 'allow' }] }
    };
    bootstrap = Bootstrap
      .setConfigSources([{ type: 'system' }])
      .configure(config);
    bootstrap.activateLogger();
    bootstrap.activateErrorHandling();
    await bootstrap.prepareRuntime();
    bootstrap = await bootstrap.activateStorage();
    bootstrap = await bootstrap.startup();

    const storageRef = Injector.get(C_STORAGE_DEFAULT) as StorageRef;
    const entries = generateMongoDataRows();
    await storageRef.getController().save(entries);
  }

  static async after() {
    if (bootstrap) {
      await bootstrap.shutdown();
      _.remove(getMetadataArgsStorage().columns, x => x.mode === 'objectId' || x.propertyName === '_id');
    }
  }


  @test
  async 'local'() {
    const controller = Injector.get(DistributedStorageEntityController);
    const results = await controller.aggregate(DataRow, [{ $match: { someBool: true } }]);
    const evenIds = results.map(x => x.id);
    expect(evenIds).to.be.deep.eq(_.range(1, 11).map(x => x * 2));
    const nodeIds = _.uniq(results.map(x => x[__NODE_ID__]));
    expect(nodeIds).to.be.deep.eq(['system']);
  }

}

