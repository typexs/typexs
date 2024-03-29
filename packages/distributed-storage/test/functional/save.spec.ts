import { suite, test } from '@testdeck/mocha';
import { expect } from 'chai';
import { Bootstrap } from '@typexs/base/Bootstrap';
import { Config } from '@allgemein/config';
import { TEST_STORAGE_OPTIONS } from '../../../base/test/functional/config';
import { IEventBusConfiguration } from '@allgemein/eventbus';
import { Container } from 'typedi';
import { TestHelper } from '@typexs/testing';
import { SpawnHandle } from '@typexs/testing';

import { DistributedStorageEntityController } from '../../src/lib/DistributedStorageEntityController';
import { ITypexsOptions } from '@typexs/base/libs/ITypexsOptions';
import { DataRow } from './fake_app/entities/DataRow';
import { __REMOTE_IDS__, XS_P_$ERRORED, XS_P_$SAVED } from '../../src/lib/Constants';
import { IDistributedQueryWorkerOptions } from '../../src/lib/IDistributedQueryWorkerOptions';
import { MODUL_CONFIG, redis_host, redis_port } from './config';


const LOG_EVENT = TestHelper.logEnable(false);


@suite('functional/distributed_storage/save')
class DistributedStorageSaveSpec {


  async before() {
    Bootstrap.reset();
    Config.clear();
  }


  @test
  async 'execute save for new entry on local node'() {
    let bootstrap = Bootstrap
      .setConfigSources([{ type: 'system' }])
      .configure(<ITypexsOptions & any>{
        app: { name: 'test', nodeId: 'system', path: __dirname + '/fake_app' },
        logging: { enable: LOG_EVENT, level: 'debug' },
        modules: MODUL_CONFIG,
        storage: { default: TEST_STORAGE_OPTIONS },
        eventbus: { default: <IEventBusConfiguration>{ adapter: 'redis', extra: { host: redis_host, port: redis_port, unref: true } } },
        workers: { access: [{ name: 'DistributedQueryWorker', access: 'allow' }] }
      });
    bootstrap.activateLogger();
    bootstrap.activateErrorHandling();
    await bootstrap.prepareRuntime();
    bootstrap = await bootstrap.activateStorage();
    bootstrap = await bootstrap.startup();


    const controller = Container.get(DistributedStorageEntityController);

    const testEntry = new DataRow();
    testEntry.someString = 'someString';
    testEntry.someNumber = 123;
    testEntry.someBool = true;
    testEntry.someDate = new Date();
    testEntry.someAny = JSON.stringify({ hallo: 'welt' });

    const saved = await controller.save(testEntry);

    const results = await controller.find(DataRow);

    await bootstrap.shutdown();

    expect(saved).to.have.length(1);
    expect(saved[0][__REMOTE_IDS__]).to.be.deep.eq({ system: { id: 1 } });
    expect(results).to.have.length(1);
    expect(results[0]).to.be.instanceOf(DataRow);
    expect((results[0] as any).id).to.be.eq(1);
  }

  @test
  async 'forbid execution save on local node'() {
    let bootstrap = Bootstrap
      .setConfigSources([{ type: 'system' }])
      .configure(<ITypexsOptions & any>{
        app: { name: 'test', nodeId: 'system', path: __dirname + '/fake_app' },
        logging: { enable: LOG_EVENT, level: 'debug' },
        modules: MODUL_CONFIG,
        storage: { default: TEST_STORAGE_OPTIONS },
        eventbus: { default: <IEventBusConfiguration>{ adapter: 'redis', extra: { host: redis_host, port: redis_port, unref: true } } },
        workers: {
          access: [{ name: 'DistributedQueryWorker', access: 'allow' }],
          config: { distributed_query_worker: <IDistributedQueryWorkerOptions>{ onlyRemote: true } }
        }
      });
    bootstrap.activateLogger();
    bootstrap.activateErrorHandling();
    await bootstrap.prepareRuntime();
    bootstrap = await bootstrap.activateStorage();
    bootstrap = await bootstrap.startup();


    const controller = Container.get(DistributedStorageEntityController);

    const testEntry = new DataRow();
    testEntry.someString = 'someString';
    testEntry.someNumber = 123;
    testEntry.someBool = true;
    testEntry.someDate = new Date();
    testEntry.someAny = JSON.stringify({ hallo: 'welt' });

    const saved = await controller.save(testEntry);
    const results = await controller.find(DataRow);
    await bootstrap.shutdown();

    expect(saved).to.have.length(1);
    expect(saved[0][__REMOTE_IDS__]).to.be.undefined;
    expect(results).to.have.length(0);
  }


  @test
  async 'execute save for new entry on remote node'() {
    let bootstrap = Bootstrap
      .setConfigSources([{ type: 'system' }])
      .configure(<ITypexsOptions & any>{
        app: { name: 'test', nodeId: 'system', path: __dirname + '/fake_app' },
        logging: { enable: LOG_EVENT, level: 'debug' },
        modules: MODUL_CONFIG,
        storage: { default: TEST_STORAGE_OPTIONS },
        eventbus: { default: <IEventBusConfiguration>{ adapter: 'redis', extra: { host: redis_host, port: redis_port, unref: true } } }
        // workers: {access: [{name: 'DistributedQueryWorker', access: 'allow'}]}
      });
    bootstrap.activateLogger();
    bootstrap.activateErrorHandling();
    await bootstrap.prepareRuntime();
    bootstrap = await bootstrap.activateStorage();
    bootstrap = await bootstrap.startup();

    const p = SpawnHandle.do(__dirname + '/fake_app/node.ts').start(LOG_EVENT);
    await p.started;
    await TestHelper.wait(500);

    const controller = Container.get(DistributedStorageEntityController);

    const testEntry = new DataRow();
    testEntry.someString = 'someString';
    testEntry.someNumber = 123;
    testEntry.someBool = true;
    testEntry.someDate = new Date();
    testEntry.someAny = JSON.stringify({ hallo: 'welt' });


    const saved = await controller.save(testEntry);
    const results = await controller.find(DataRow);


    p.shutdown();
    await p.done;
    await bootstrap.shutdown();

    expect(saved[XS_P_$SAVED]).to.be.eq(1);
    expect(saved[XS_P_$ERRORED]).to.be.eq(0);
    expect(saved[0][__REMOTE_IDS__]).to.be.deep.eq({ fakeapp01: { id: 21 } });
    expect(results).to.have.length(21);
    expect(results[0]).to.be.instanceOf(DataRow);

  }

  @test.skip
  async 'execute save for new entry on remote node (remote exception handling)'() {

  }

}

