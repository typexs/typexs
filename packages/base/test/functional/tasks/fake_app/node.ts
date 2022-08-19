import { SPAWN_TIMEOUT, TEST_STORAGE_OPTIONS } from '../../config';
import { IEventBusConfiguration } from '@allgemein/eventbus';
import { ITypexsOptions } from '../../../../src/libs/ITypexsOptions';
import { TestHelper, TypeXsInstance } from '@typexs/testing';


new TypeXsInstance('fakeapp01')
  .configure(<ITypexsOptions & any>{
    app: {
      path: __dirname
    },
    modules: {
      paths: TestHelper.includePaths(),
      disableCache: true
    },
    storage: {
      default: TEST_STORAGE_OPTIONS
    },
    eventbus: {
      default: <IEventBusConfiguration>{
        adapter: 'redis', extra: { host: '127.0.0.1', port: 6379, unref: true }
      }
    }
  }).run();


// (async function () {
//   const LOG_EVENT = !!process.argv.find(x => x === '--enable_log');
//   let NODEID = process.argv.find(x => x.startsWith('--nodeId='));
//   if (NODEID) {
//     NODEID = NODEID.split('=').pop();
//   } else {
//     NODEID = 'fakeapp01';
//   }
//   let bootstrap = Bootstrap
//     .setConfigSources([{type: 'system'}])
//     .configure();
//   bootstrap.activateLogger();
//   bootstrap.activateErrorHandling();
//   await bootstrap.prepareRuntime();
//   bootstrap = await bootstrap.activateStorage();
//   bootstrap = await bootstrap.startup();
//   process.send('startup');
//   const timeout = parseInt(Config.get('argv.timeout', SPAWN_TIMEOUT), 10);
//
//
//   const t = setTimeout(async () => {
//     await bootstrap.shutdown();
//   }, timeout);
//
//   let running = true;
//   process.on(<any>'message', async (m: string) => {
//
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
// })();
//
