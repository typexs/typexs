import {IEventBusConfiguration} from 'commons-eventbus';
import {Bootstrap, Config} from '@typexs/base';
import {getBootstrapForSpawn} from '../spawn';

(async function () {

  let bootstrap: Bootstrap = getBootstrapForSpawn('fake_app_node_tasks', {
    app: {path: __dirname},
    eventbus: {default: <IEventBusConfiguration>{adapter: 'redis', extra: {host: '127.0.0.1', port: 6379}}},
    workers: {
      access: [
        {name: 'TaskQueueWorker', access: 'allow'},
        {name: 'ExchangeMessageWorker', access: 'allow'}
      ]
    },
    tasks: {logdir: '/tmp/taskmonitor/fake_app_node_tasks'},
    filesystem: {paths: ['/tmp/taskmonitor']}
  });


  // create manuell
  // PlatformUtils.mkdir('/tmp/taskmonitor/fake_app_node_tasks');

  bootstrap.activateLogger();
  bootstrap.activateErrorHandling();
  await bootstrap.prepareRuntime();
  bootstrap = await bootstrap.activateStorage();
  bootstrap = await bootstrap.startup();


  process.send('startup');

  const timeout = parseInt(Config.get('argv.timeout', 240000), 0);
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

