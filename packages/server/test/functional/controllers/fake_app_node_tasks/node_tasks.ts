import { IEventBusConfiguration } from '@allgemein/eventbus';
import { Bootstrap, Config } from '@typexs/base';
import { getBootstrapForSpawn } from '../spawn';
import { redis_host, redis_port } from '../../config';

(async function() {

  let bootstrap: Bootstrap = getBootstrapForSpawn('fake_app_node_tasks', {
    app: { path: __dirname },
    eventbus: { default: <IEventBusConfiguration>{ adapter: 'redis', extra: { host: redis_host, port: redis_port, unref: true } } },
    workers: {
      access: [
        { name: 'TaskQueueWorker', access: 'allow' },
        { name: 'ExchangeMessageWorker', access: 'allow' }
      ]
    },
    tasks: {
      logdir: '/tmp/taskmonitor/fake_app_node_tasks', logger: 'winston',
      logging: 'file'
    },
    filesystem: { paths: ['/tmp/taskmonitor'] }
  });


  // create manuell
  // PlatformUtils.mkdir('/tmp/taskmonitor/fake_app_node_tasks');

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

