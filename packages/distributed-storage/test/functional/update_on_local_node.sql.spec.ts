import {expect} from 'chai';
import {suite, test} from '@testdeck/mocha';
import {Bootstrap} from '@typexs/base/Bootstrap';
import {Config} from '@allgemein/config';
import {TEST_STORAGE_OPTIONS} from '../../../base/test/functional/config';
import {IEventBusConfiguration} from '@allgemein/eventbus';
import {TestHelper} from '@typexs/testing';

import { DistributedStorageEntityController } from '../../src/lib/DistributedStorageEntityController';
import {ITypexsOptions} from '@typexs/base/libs/ITypexsOptions';
import {DataRow} from './fake_app_mongo/entities/DataRow';
import {IEntityController} from '@typexs/base/libs/storage/IEntityController';
import {Injector} from '@typexs/base/libs/di/Injector';
import {C_STORAGE_DEFAULT} from '@typexs/base/libs/Constants';
import {StorageRef} from '@typexs/base/libs/storage/StorageRef';
import {generateSqlDataRows} from './helper';
import { MODUL_CONFIG, redis_host, redis_port } from './config';


const LOG_EVENT = TestHelper.logEnable(false);

let bootstrap: Bootstrap;
// let p: SpawnHandle;
let controllerRef: IEntityController;

@suite('functional/distributed_storage/update_on_local_node')
class DistributedStorageSaveSpec {


  static async before() {
    Bootstrap.reset();
    Config.clear();
    const DB_OPTIONS = TEST_STORAGE_OPTIONS;
    // set(DB_OPTIONS, 'database', 'typexs_local');
    bootstrap = Bootstrap
      .setConfigSources([{type: 'system'}])
      .configure(<ITypexsOptions & any>{
        app: {name: 'test', nodeId: 'system', path: __dirname + '/fake_app'},
        logging: {enable: LOG_EVENT, level: 'debug'},
        modules: MODUL_CONFIG,
        storage: {default: DB_OPTIONS},
        eventbus: {default: <IEventBusConfiguration>{adapter: 'redis', extra: {host: redis_host, port: redis_port, unref: true}}},
        workers: {access: [{name: 'DistributedQueryWorker', access: 'allow'}]}
      });
    bootstrap.activateLogger();
    bootstrap.activateErrorHandling();
    await bootstrap.prepareRuntime();
    bootstrap = await bootstrap.activateStorage();
    bootstrap = await bootstrap.startup();

    const storageRef = Injector.get(C_STORAGE_DEFAULT) as StorageRef;
    controllerRef = storageRef.getController();
    const entries = generateSqlDataRows();
    await storageRef.getController().save(entries);
  }

  static async after() {
    if (bootstrap) {
      await bootstrap.shutdown();
    }
  }


  @test
  async 'update single entity'() {
    const controller = Injector.get(DistributedStorageEntityController);
    const results = await controller.update(DataRow, {id: 10}, {$set: {someString: 'Hallo welt'}});
    // console.log(results);
    // -2 means sqlite doesn't support affected rows info
    expect(results).to.be.deep.eq({system: -2});
    const entry = await controllerRef.findOne(DataRow, {id: 10});
    expect(entry.someString).to.be.deep.eq('Hallo welt');
  }

  @test
  async 'update multiple entities'() {
    const controller = Injector.get(DistributedStorageEntityController);
    const results = await controller.update(DataRow, {someBool: false}, {$set: {someString: 'Hallo welt setted by update'}});
    // console.log(results);
    // -2 means sqlite doesn't support affected rows info
    expect(results).to.be.deep.eq({system: -2});
    const entry = await controllerRef.findOne(DataRow, {someBool: false});
    expect(entry.someString).to.be.deep.eq('Hallo welt setted by update');
  }


  @test
  async 'catch exception - wrong update query'() {
    const controller = Injector.get(DistributedStorageEntityController);
    try {
      const results = await controller.update(DataRow, {id: 10}, {$set: {some_String: 'Hallo welt'}});
      expect(false, 'exception not fired ...').to.be.eq(true);
    } catch (e) {
      expect(e.message).to.be.eq('system: No entity column "some_String" was found.');
    }
  }

  @test
  async 'catch exception - wrong condition query'() {
    const controller = Injector.get(DistributedStorageEntityController);
    try {
      const results = await controller.update(DataRow, {ids: 10}, {$set: {someString: 'Hallo welt'}});
      expect(false, 'exception not fired ...').to.be.eq(true);
    } catch (e) {
      expect(e.message).to.be.eq('system: SQLITE_ERROR: no such column: ids');
    }
  }

}

