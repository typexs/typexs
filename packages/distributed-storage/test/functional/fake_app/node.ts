import { redis_host, redis_port, SPAWN_TIMEOUT, TEST_STORAGE_OPTIONS } from './../config';
import {IEventBusConfiguration} from '@allgemein/eventbus';
import {Config} from '@allgemein/config';
import {ITypexsOptions} from '@typexs/base/libs/ITypexsOptions';
import {Bootstrap} from '@typexs/base/Bootstrap';
import {generateSqlDataRows} from '../helper';
import {Injector} from '@typexs/base/libs/di/Injector';
import {C_STORAGE_DEFAULT} from '@typexs/base/libs/Constants';
import {StorageRef} from '@typexs/base/libs/storage/StorageRef';
import { TestHelper } from '@typexs/testing';

(async function () {
  const LOG_EVENT = !!process.argv.find(x => x === '--enable_log');
  let NODEID = process.argv.find(x => x.startsWith('--nodeId='));
  if (NODEID) {
    NODEID = NODEID.split('=').pop();
  } else {
    NODEID = 'fakeapp01';
  }

  let bootstrap = Bootstrap
    .setConfigSources([{type: 'system'}])
    .configure(<ITypexsOptions & any>{
      app: {name: NODEID, nodeId: NODEID, path: __dirname},
      logging: {enable: LOG_EVENT, level: 'debug'},
      modules: {
        paths: [
          TestHelper.root()
        ],
        include: [
          '**/@allgemein{,/eventbus}*',
          '**/@typexs{,/base}*',
          '**/@typexs{,/distributed-storage}*',
          '**/fake_app**'
        ],
        disableCache: true
      },
      storage: {default: TEST_STORAGE_OPTIONS},
      eventbus: {default: <IEventBusConfiguration>{adapter: 'redis', extra: {host: redis_host, port: redis_port, unref: true}}},
      workers: {access: [{name: 'DistributedQueryWorker', access: 'allow'}]}
    });
  bootstrap.activateLogger();
  bootstrap.activateErrorHandling();
  await bootstrap.prepareRuntime();
  bootstrap = await bootstrap.activateStorage();
  bootstrap = await bootstrap.startup();

  const entries = generateSqlDataRows();

  const storageRef = Injector.get(C_STORAGE_DEFAULT) as StorageRef;
  const controllerRef = storageRef.getController();
  await controllerRef.save(entries);

  process.send('startup');

  const timeout = parseInt(Config.get('argv.timeout', SPAWN_TIMEOUT), 10);
  const t = setTimeout(async () => {
    await bootstrap.shutdown();
  }, timeout);

  let running = true;
  process.on(<any>'message', async (m: string) => {

    if (m === 'shutdown') {
      running = false;
      clearTimeout(t);
      await bootstrap.shutdown();
      process.exit(0);
    }
  });
  process.on('exit', async () => {
    if (running) {
      running = false;
      clearTimeout(t);
      await bootstrap.shutdown();
    }
  });


})();

