import { IEventBusConfiguration } from '@allgemein/eventbus';
import { Config } from '@allgemein/config';
import { Bootstrap, ITypexsOptions } from '@typexs/base';
import { redis_host, redis_port, SPAWN_TIMEOUT, TEST_STORAGE_OPTIONS } from '../../../../../../base/test/functional/config';
import { REMOTE_LOG_DIR } from '../config';
import { TestHelper } from '@typexs/testing';

(async function () {
  const LOG_EVENT = !!process.argv.find(x => x === '--enable_log');
  let bootstrap = Bootstrap
    .setConfigSources([{type: 'system'}])
    .configure(<ITypexsOptions & any>{
      app: {name: 'fakeapp01', nodeId: 'remote_fakeapp01', path: __dirname},
      logging: {
        enable: LOG_EVENT,
        level: 'debug',
        transports: [{console: {}}],
        loggers: [{name: '*', level: 'debug', transports: [{console: {}}]}]
      },

      modules: {
        paths:  TestHelper.includePaths(['base', 'tasks']),
        disableCache: true
      },
      storage: {default: TEST_STORAGE_OPTIONS},
      eventbus: {default: <IEventBusConfiguration>{adapter: 'redis', extra: {host: redis_host, port: redis_port, unref: true}}},
      workers: {
        access: [
          {name: 'ExchangeMessageWorker', access: 'allow'},
          {name: 'TaskQueueWorker', access: 'allow'}
        ]
      },
      tasks: {logdir: REMOTE_LOG_DIR + '/logs'},
      filesystem: {paths: [REMOTE_LOG_DIR]}
    });
  bootstrap.activateLogger();
  bootstrap.activateErrorHandling();
  await bootstrap.prepareRuntime();
  bootstrap = await bootstrap.activateStorage();
  bootstrap = await bootstrap.startup();

  process.send('startup');


  // eslint-disable-next-line radix
  const timeout = parseInt(Config.get('argv.timeout', SPAWN_TIMEOUT));
  /*
  let commands = bootstrap.getCommands();
  expect(commands.length).to.be.gt(0);
  let command = find(commands, e => e.command == 'worker');
  command.handler({});
  */

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

