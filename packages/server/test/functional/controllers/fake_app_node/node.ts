import {IEventBusConfiguration} from 'commons-eventbus';
import {Bootstrap, Config} from '@typexs/base';
import {getBootstrapForSpawn} from '../spawn';

(async function () {
  let bootstrap: Bootstrap = getBootstrapForSpawn('fake_app_node', {
    app: {
      path: __dirname
    },
    logging: {
      enable: true
    },
    modules: {
      disableCache: true,
      include: [
        '**/packages/base**',
        '**/packages/server**',
        '**/fake_app_node**'
      ],
    },
    eventbus: {default: <IEventBusConfiguration>{adapter: 'redis', extra: {host: '127.0.0.1', port: 6379}}},
    workers: {access: [{name: 'DistributedQueryWorker', access: 'allow'}]}
  });

  bootstrap.activateLogger();
  bootstrap.activateErrorHandling();
  await bootstrap.prepareRuntime();
  bootstrap = await bootstrap.activateStorage();
  bootstrap = await bootstrap.startup();
  const timeout = parseInt(Config.get('argv.timeout', 20000), 10);

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

