import { SPAWN_TIMEOUT, TEST_STORAGE_OPTIONS } from '../../config';
import { Config } from '@allgemein/config';
import { TestHelper } from '@typexs/testing';
import { Bootstrap } from '../../../../src/Bootstrap';
import { ITypexsOptions } from '../../../../src/libs/ITypexsOptions';
import { CACHE_CONFIG, EVENTBUS_CONFIG } from '../config';


(async function() {
  const LOG_EVENT = false;
  let bootstrap = Bootstrap
    .setConfigSources([{ type: 'system' }])
    .configure(<ITypexsOptions & any>{
      app: {
        name: 'fakeapp01',
        nodeId: 'fakeapp01',
        path: __dirname
      },
      logging: {
        enable: LOG_EVENT,
        level: 'debug'
      },
      modules: {
        paths: TestHelper.includePaths(),
        disableCache: true
      },
      storage: { default: TEST_STORAGE_OPTIONS },
      cache: CACHE_CONFIG,
      eventbus: EVENTBUS_CONFIG
    });
  bootstrap.activateLogger();
  bootstrap.activateErrorHandling();
  await bootstrap.prepareRuntime();
  bootstrap = await bootstrap.activateStorage();
  bootstrap = await bootstrap.startup();
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

