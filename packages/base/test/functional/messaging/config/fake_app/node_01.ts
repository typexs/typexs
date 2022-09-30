import {IEventBusConfiguration} from '@allgemein/eventbus';
import {Config} from '@allgemein/config';
import {ITypexsOptions} from '../../../../../src/libs/ITypexsOptions';
import { redis_host, redis_port, SPAWN_TIMEOUT, TEST_STORAGE_OPTIONS } from '../../../config';
import {Bootstrap} from '../../../../../src/Bootstrap';
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
        paths:  TestHelper.includePaths(),
        disableCache: true
      },
      storage: {default: TEST_STORAGE_OPTIONS},
      eventbus: {default: <IEventBusConfiguration>{adapter: 'redis', extra: {
        host: redis_host, port: redis_port, unref: true}}},
      workers: {access: [{name: 'ExchangeMessageWorker', access: 'allow'}]}
    });
  bootstrap.activateLogger();
  bootstrap.activateErrorHandling();
  await bootstrap.prepareRuntime();
  bootstrap = await bootstrap.activateStorage();
  bootstrap = await bootstrap.startup();
  process.send('startup');

  const timeout = parseInt(Config.get('argv.timeout', SPAWN_TIMEOUT), 10);
  /*
  let commands = bootstrap.getCommands();
  expect(commands.length).to.be.gt(0);
  let command = _.find(commands, e => e.command == 'worker');
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

