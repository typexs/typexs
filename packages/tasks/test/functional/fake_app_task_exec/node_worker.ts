import { redis_host, redis_port, TEST_STORAGE_OPTIONS } from '../../../../base/test/functional/config';
import {Config} from '@allgemein/config';
import {ITypexsOptions} from '@typexs/base';
import {Bootstrap} from '@typexs/base';
import { EventBus, IEventBusConfiguration, RedisEventBusAdapter } from '@allgemein/eventbus';
import { TestHelper } from '@typexs/testing';
(async function () {
  EventBus.registerAdapter(RedisEventBusAdapter);
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
      logging: {
        enable: LOG_EVENT,
        level: 'debug',
        transports: [
          {console: {}}
        ],
        loggers: [{
          name: '*', level: 'debug', transports: [{console: {}}]
        }]
      },
      modules: {
        paths: TestHelper.includePaths(),
        disableCache: true},
      storage: {default: TEST_STORAGE_OPTIONS},
      eventbus: {
        default: <IEventBusConfiguration>{
          adapter: 'redis', extra: {host: redis_host, port: redis_port, unref: true}
        }
      },
      workers: {
        access: [
          {name: 'TaskQueueWorker', access: 'allow'},
          {name: 'ExchangeMessageWorker', access: 'allow'}
        ]
      }
    });
  bootstrap.activateLogger();
  bootstrap.activateErrorHandling();
  await bootstrap.prepareRuntime();
  bootstrap = await bootstrap.activateStorage();
  bootstrap = await bootstrap.startup();


  process.send('startup');

  const timeout = parseInt(Config.get('argv.timeout', 240000), 10);
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

