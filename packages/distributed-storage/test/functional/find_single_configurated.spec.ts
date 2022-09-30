import { suite, test } from '@testdeck/mocha';
import { expect } from 'chai';
import { Bootstrap } from '@typexs/base/Bootstrap';
import { Config } from '@allgemein/config';
import { TEST_STORAGE_OPTIONS } from '../../../base/test/functional/config';
import { IEventBusConfiguration } from '@allgemein/eventbus';
import { Container } from 'typedi';
import { TestHelper } from '@typexs/testing';
import { SystemNodeInfo } from '@typexs/base/entities/SystemNodeInfo';

import { DistributedStorageEntityController } from '../../src/lib/DistributedStorageEntityController';
import { DistributedQueryWorker } from '../../src/workers/DistributedQueryWorker';
import { Workers } from '@typexs/base/libs/worker/Workers';
import { ITypexsOptions } from '@typexs/base/libs/ITypexsOptions';
import { MODUL_CONFIG, redis_host, redis_port } from './config';


const LOG_EVENT = TestHelper.logEnable(false);

let bootstrap: Bootstrap;

@suite('functional/distributed/find_single_configurated')
class DistributedQuerySpec {


  async before() {
    Bootstrap.reset();
    Config.clear();

    bootstrap = Bootstrap
      .setConfigSources([{ type: 'system' }])
      .configure(<ITypexsOptions & any>{
        app: { name: 'test', nodeId: 'system', path: __dirname + '/fake_app' },
        logging: { enable: LOG_EVENT, level: 'debug' },
        modules: MODUL_CONFIG,
        storage: { default: TEST_STORAGE_OPTIONS },
        eventbus: { default: <IEventBusConfiguration>{ adapter: 'redis', extra: { host: redis_host, port: redis_port, unref: true } } },
        // CONFIG ADDED
        workers: { access: [{ name: 'DistributedQueryWorker', access: 'allow' }] }
      });
    bootstrap.activateLogger();
    bootstrap.activateErrorHandling();
    await bootstrap.prepareRuntime();
    bootstrap = await bootstrap.activateStorage();
    bootstrap = await bootstrap.startup();
  }


  async after() {
    if (bootstrap) {
      await bootstrap.shutdown();
    }
  }


  @test
  async 'start worker by configuration'() {
    const workers: Workers = Container.get(Workers.NAME);
    const active = workers.activeWorkerCount();
    expect(active).to.be.eq(1);

    const controller = Container.get(DistributedStorageEntityController);
    const results = await controller.find(SystemNodeInfo);
    expect(results).to.have.length(1);
  }


}

