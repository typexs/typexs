import { redis_host, redis_port, SPAWN_TIMEOUT, TEST_PSQL_STORAGE_OPTIONS, TEST_STORAGE_OPTIONS } from '../../config';
import {IEventBusConfiguration} from '@allgemein/eventbus';
import {Config} from '@allgemein/config';
import {Bootstrap} from '../../../../src/Bootstrap';
import {ITypexsOptions} from '../../../../src/libs/ITypexsOptions';
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
      logging: {enable: LOG_EVENT, level: 'debug', loggers: [{name: '*', level: 'debug'}]},
      modules: {paths: TestHelper.includePaths()},
      storage: {default: TEST_PSQL_STORAGE_OPTIONS},
      eventbus: {default: <IEventBusConfiguration>{adapter: 'redis',
          extra: {host: redis_host, port: redis_port, unref: true}}}
    });
  bootstrap.activateLogger();
  bootstrap.activateErrorHandling();
  await bootstrap.prepareRuntime();
  bootstrap = await bootstrap.activateStorage();
  bootstrap = await bootstrap.startup();
  process.send('startup');

  const timeout = parseInt(Config.get('argv.timeout', SPAWN_TIMEOUT), 0);
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

