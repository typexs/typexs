import { SPAWN_TIMEOUT, TEST_STORAGE_OPTIONS } from '../../config';
import { IEventBusConfiguration } from '@allgemein/eventbus';
import { Config } from '@allgemein/config';
import { Bootstrap } from '../../../../src/Bootstrap';
import { ITypexsOptions } from '../../../../src/libs/ITypexsOptions';
import { TestHelper, TypeXsInstance } from '@typexs/testing';


new TypeXsInstance('fakeapp01')
  .configure(<ITypexsOptions & any>{
    app: { path: __dirname },
    modules: { paths: TestHelper.includePaths(), disableCache: true },
    storage: { default: TEST_STORAGE_OPTIONS },
    eventbus: { default: <IEventBusConfiguration>{ adapter: 'redis', extra: { host: '127.0.0.1', port: 6379, unref: true } } },
    workers: { access: [{ name: 'TaskQueueWorker', access: 'allow' }] }
  }).run();


//
// (async function () {
//
//   let bootstrap = Bootstrap
//     .setConfigSources([{type: 'system'}])
//     .configure(<ITypexsOptions & any>{
//       app: {name: 'fakeapp01', nodeId: 'fakeapp01', path: __dirname},
//       logging: {enable: false, level: 'debug', loggers: [{name: '*', level: 'debug'}]},
//       modules: {paths: TestHelper.includePaths(), disableCache: true},
//       storage: {default: TEST_STORAGE_OPTIONS},
//       // cache: {bins: {default: 'redis1'}, adapter: {redis1: {type: 'redis', host: '127.0.0.1', port: 6379}}},
//       eventbus: {default: <IEventBusConfiguration>{adapter: 'redis', extra: {host: '127.0.0.1', port: 6379, unref: true}}},
//       workers: {access: [{name: 'TaskQueueWorker', access: 'allow'}]}
//     });
//   bootstrap.activateLogger();
//   bootstrap.activateErrorHandling();
//   await bootstrap.prepareRuntime();
//   bootstrap = await bootstrap.activateStorage();
//   bootstrap = await bootstrap.startup();
//   process.send('startup');
//   const timeout = parseInt(Config.get('argv.timeout', SPAWN_TIMEOUT), 10);
//
//   const t = setTimeout(async () => {
//     await bootstrap.shutdown();
//   }, timeout);
//
//   let running = true;
//   process.on(<any>'message', async (m: string) => {
//     if (m === 'shutdown') {
//       running = false;
//       clearTimeout(t);
//       await bootstrap.shutdown();
//       process.exit(0);
//     }
//   });
//   process.on('exit', async () => {
//     if (running) {
//       running = false;
//       clearTimeout(t);
//       await bootstrap.shutdown();
//     }
//   });
//
//
// })();
//
