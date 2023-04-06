import { expect } from 'chai';
import { suite, test } from '@testdeck/mocha';
import { Bootstrap } from '@typexs/base/Bootstrap';
import { Config } from '@allgemein/config';
import { TEST_STORAGE_OPTIONS } from '../../../base/test/functional/config';
import { IEventBusConfiguration } from '@allgemein/eventbus';
import { Container } from 'typedi';
import { TestHelper } from '@typexs/testing';
import { DistributedStorageEntityController } from '../../src/lib/DistributedStorageEntityController';
import { ITypexsOptions } from '@typexs/base/libs/ITypexsOptions';
import { DataRow } from './fake_app/entities/DataRow';
import * as _ from 'lodash';
import { Injector } from '@typexs/base/libs/di/Injector';
import { __NODE_ID__, __REGISTRY__, C_STORAGE_DEFAULT } from '@typexs/base/libs/Constants';
import { StorageRef } from '@typexs/base/libs/storage/StorageRef';
import { SpawnHandle } from '@typexs/testing';
import { generateSqlDataRows } from './helper';
import { __CLASS__ } from '@allgemein/schema-api';
import { MODUL_CONFIG, redis_host, redis_port } from './config';


const LOG_EVENT = TestHelper.logEnable(false);

let bootstrap: Bootstrap;

// let p: SpawnHandle;
const p: SpawnHandle[] = [];


@suite('functional/distributed_storage/aggregate_on_multi_nodes (sql)')
class DistributedStorageSaveSpec {


  static async before() {
    Bootstrap.reset();
    Config.clear();
    const DB_OPTIONS = TEST_STORAGE_OPTIONS;
    // _.set(DB_OPTIONS, 'database', 'typexs_local');
    bootstrap = Bootstrap
      .setConfigSources([{ type: 'system' }])
      .configure(<ITypexsOptions & any>{
        app: { name: 'test', nodeId: 'system', path: __dirname + '/fake_app' },
        logging: { enable: LOG_EVENT, level: 'debug' },
        modules: MODUL_CONFIG,
        storage: { default: DB_OPTIONS },
        eventbus: { default: <IEventBusConfiguration>{ adapter: 'redis', extra: { host: redis_host, port: redis_port, unref: true } } },
        workers: { access: [{ name: 'DistributedQueryWorker', access: 'allow' }] }
      });
    bootstrap.activateLogger();
    bootstrap.activateErrorHandling();
    await bootstrap.prepareRuntime();
    bootstrap = await bootstrap.activateStorage();
    bootstrap = await bootstrap.startup();

    const storageRef = Injector.get(C_STORAGE_DEFAULT) as StorageRef;

    p[0] = SpawnHandle.do(__dirname + '/fake_app/node.ts').nodeId('remote01').start(LOG_EVENT);
    await p[0].started;

    p[1] = SpawnHandle.do(__dirname + '/fake_app/node.ts').nodeId('remote02').start(LOG_EVENT);
    await p[1].started;

    await TestHelper.wait(500);

    const entries = generateSqlDataRows();
    await storageRef.getController().save(entries);
  }

  static async after() {
    if (bootstrap) {
      await bootstrap.shutdown();

      if (p.length > 0) {
        p.map(x => x.shutdown());
        await Promise.all(p.map(x => x.done));
      }

    }
  }


  @test
  async 'simple match aggregation'() {
    const controller = Container.get(DistributedStorageEntityController);
    let results = await controller.aggregate(DataRow, [{ $match: { someBool: true } }]);
    expect(results).to.have.length(30);
    results = _.orderBy(results, [__NODE_ID__]) as any;
    // console.log(results);
    const evenIds = results.map(x => x.id);

    expect(evenIds).to.be.deep.eq(_.concat(_.range(1, 11).map(x => x * 2), _.range(1, 11).map(x => x * 2), _.range(1, 11).map(x => x * 2)));
    const nodeIds = _.uniq(results.map(x => x[__NODE_ID__]));
    expect(nodeIds).to.be.deep.eq(['remote01', 'remote02', 'system']);

  }


  @test
  async 'match and group aggregation'() {
    const controller = Container.get(DistributedStorageEntityController);
    let results = await controller.aggregate(DataRow, [
      { $match: { someBool: true } },
      { $group: { _id: null, sum: { $sum: 1 } } }
    ]) as any[];


    expect(results).to.have.length(3);
    results = _.orderBy(results, [__NODE_ID__]);
    expect(results[0]).to.be.deep.eq({
      sum: 10,
      [__NODE_ID__]: 'remote01',
      [__CLASS__]: 'DataRow',
      [__REGISTRY__]: 'typeorm'
    });
    expect(results[1]).to.be.deep.eq({
      sum: 10,
      [__NODE_ID__]: 'remote02',
      [__CLASS__]: 'DataRow',
      [__REGISTRY__]: 'typeorm'
    });
    expect(results[2]).to.be.deep.eq({
      sum: 10,
      [__NODE_ID__]: 'system',
      [__CLASS__]: 'DataRow',
      [__REGISTRY__]: 'typeorm'
    });

    const nodeIds = _.uniq(results.map(x => x[__NODE_ID__]));
    expect(nodeIds).to.be.deep.eq(['remote01', 'remote02', 'system']);

  }


  @test
  async 'match and group aggregation on targeted node'() {
    const controller = Container.get(DistributedStorageEntityController);
    let results = await controller.aggregate(DataRow, [
      { $match: { someBool: true } },
      { $group: { _id: null, sum: { $sum: 1 } } }
    ], { targetIds: ['remote02'] }) as any[];


    expect(results).to.have.length(1);
    results = _.orderBy(results, [__NODE_ID__]);
    expect(results[0]).to.be.deep.eq({
      sum: 10,
      [__NODE_ID__]: 'remote02',
      [__CLASS__]: 'DataRow',
      [__REGISTRY__]: 'typeorm'
    });

    const nodeIds = _.uniq(results.map(x => x[__NODE_ID__]));
    expect(nodeIds).to.be.deep.eq(['remote02']);
  }

  @test
  async 'match and group by key aggregation'() {
    const controller = Container.get(DistributedStorageEntityController);
    let results = await controller.aggregate(DataRow, [
      { $match: { someBool: true } },
      { $group: { _id: 'someFlag', sum: { $sum: 1 } } }
    ]) as any[];

    expect(results).to.have.length(9);
    results = _.orderBy(results, [__NODE_ID__, 'someFlag']);
    expect(results).to.be.deep.eq([
      {
        someFlag: '0', sum: 3,
        [__NODE_ID__]: 'remote01',
        [__CLASS__]: 'DataRow',
        [__REGISTRY__]: 'typeorm'
      },
      {
        someFlag: '10', sum: 3,
        [__NODE_ID__]: 'remote01',
        [__CLASS__]: 'DataRow',
        [__REGISTRY__]: 'typeorm'
      },
      {
        someFlag: '20', sum: 4,
        [__NODE_ID__]: 'remote01',
        [__CLASS__]: 'DataRow',
        [__REGISTRY__]: 'typeorm'
      },
      {
        someFlag: '0', sum: 3,
        [__NODE_ID__]: 'remote02',
        [__CLASS__]: 'DataRow',
        [__REGISTRY__]: 'typeorm'
      },
      {
        someFlag: '10', sum: 3,
        [__NODE_ID__]: 'remote02',
        [__CLASS__]: 'DataRow',
        [__REGISTRY__]: 'typeorm'
      },
      {
        someFlag: '20', sum: 4,
        [__NODE_ID__]: 'remote02',
        [__CLASS__]: 'DataRow',
        [__REGISTRY__]: 'typeorm'
      },
      {
        someFlag: '0', sum: 3,
        [__NODE_ID__]: 'system',
        [__CLASS__]: 'DataRow',
        [__REGISTRY__]: 'typeorm'
      },
      {
        someFlag: '10', sum: 3,
        [__NODE_ID__]: 'system',
        [__CLASS__]: 'DataRow',
        [__REGISTRY__]: 'typeorm'
      },
      {
        someFlag: '20', sum: 4,
        [__NODE_ID__]: 'system',
        [__CLASS__]: 'DataRow',
        [__REGISTRY__]: 'typeorm'
      }
    ]);

    const nodeIds = _.uniq(results.map(x => x[__NODE_ID__]));
    expect(nodeIds).to.be.deep.eq(['remote01', 'remote02', 'system']);
  }


  @test
  async 'limit and offset'() {
    const controller = Container.get(DistributedStorageEntityController);
    let results = await controller.aggregate(DataRow, [
      { $group: { _id: 'someFlag', sum: { $sum: 1 } } },
      { $skip: 1 },
      { $limit: 1 }
    ]) as any[];
    results = _.orderBy(results, [__NODE_ID__, 'someFlag']);
    expect(results).to.have.length(3);
    expect(results[0]).to.be.deep.eq({
      someFlag: '10', sum: 7,
      [__NODE_ID__]: 'remote01',
      [__CLASS__]: 'DataRow',
      [__REGISTRY__]: 'typeorm'
    });

    const nodeIds = _.uniq(results.map(x => x[__NODE_ID__]));
    expect(nodeIds).to.be.deep.eq(['remote01', 'remote02', 'system']);
  }


  @test
  async 'causing remote exception'() {
    const controller = Container.get(DistributedStorageEntityController);
    try {
      const results = await controller.aggregate(DataRow, [
        { $group: { _id: 'do_not_exists', sum: { $sum: 1 } } }
      ]) as any[];
      expect(false, 'exception not fired ...').to.be.eq(true);
    } catch (e) {
      expect(e).to.be.instanceOf(Error);
      expect(e.message.split('\n').sort()).to.be.deep.eq([
        'remote01: SQLITE_ERROR: no such column: aggr.do_not_exists',
        'remote02: SQLITE_ERROR: no such column: aggr.do_not_exists',
        'system: SQLITE_ERROR: no such column: aggr.do_not_exists'
      ]);
    }
  }

}

