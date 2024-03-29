// import { IEventBusConfiguration } from '@allgemein/eventbus';
// import { Bootstrap, C_STORAGE_DEFAULT, Config, Injector, StorageRef } from '@typexs/base';
//
// import { DistributedRandomData } from './entities/DistributedRandomData';
// import { getBootstrapForSpawn } from '../spawn';
// import { TestHelper } from '../../TestHelper';
//
// (async function() {
//
//   let bootstrap: Bootstrap = getBootstrapForSpawn('fake_app_node', {
//     app: {
//       path: __dirname
//     },
//     modules: {
//       disableCache: true,
//       paths: [
//         TestHelper.root()
//       ],
//       include: [
//         '**/@allgemein{,/eventbus}*',
//         '**/@typexs{,/base}*',
//         '**/@typexs{,/server}*',
//         '**/fake_app_node**'
//       ]
//     },
//     eventbus: { default: <IEventBusConfiguration>{ adapter: 'redis', extra: { host: redis_host, port: redis_port, unref: true } } },
//     workers: { access: [{ name: 'DistributedQueryWorker', access: 'allow' }] }
//   });
//   // const LOG_EVENT = !!process.argv.find(x => x === '--enable_log');
//   // let NODEID = process.argv.find(x => x.startsWith('--nodeId='));
//   // if (NODEID) {
//   //   NODEID = NODEID.split('=').pop();
//   // } else {
//   //   NODEID = 'fake_app_node_tasks';
//   // }
//   //
//   // let bootstrap = Bootstrap
//   //   .setConfigSources([{type: 'system'}])
//   //   .configure(<ITypexsOptions & any>{
//   //     app: {name: 'fake_app_node', nodeId: 'fake_app_node', path: __dirname},
//   //     logging: {enable: LOG_EVENT, level: 'debug'},
//   //     modules: {
//   //       paths: [
//   //         __dirname + '/../../../../..'
//   //       ],
//   //       disableCache: true,
//   //       include: [
//   //         '**/packages/base**',
//   //         '**/packages/server**',
//   //         '**/fake_app_node**'
//   //       ],
//   //     },
//   //     storage: {default: TEST_STORAGE_OPTIONS},
//   //     eventbus: {default: <IEventBusConfiguration>{adapter: 'redis', extra: {host: redis_host, port: redis_port}}},
//   //     workers: {access: [{name: 'DistributedQueryWorker', access: 'allow'}]}
//   //   });
//   bootstrap.activateLogger();
//   bootstrap.activateErrorHandling();
//   await bootstrap.prepareRuntime();
//   bootstrap = await bootstrap.activateStorage();
//   bootstrap = await bootstrap.startup();
//
//
//   /**
//    * generate test data
//    */
//   const defaultStorageRef = Injector.get(C_STORAGE_DEFAULT) as StorageRef;
//   const entries = [];
//   const d = new Date();
//   for (let i = 1; i < 11; i++) {
//     const randomData = new DistributedRandomData();
//     randomData.id = i;
//     randomData.numValue = i * 100;
//     randomData.floatValue = i * 0.893;
//     randomData.bool = i % 2 === 0;
//     randomData.date = new Date(2020, i, i * 2, 0, 0, 0);
//     randomData.short = 'short name ' + i;
//     randomData.long = 'long long long very long '.repeat(i * 5);
//     entries.push(randomData);
//
//   }
//   await defaultStorageRef.getController().save(entries);
//
//   // eslint-disable-next-line radix
//   const timeout = parseInt(Config.get('argv.timeout', 240000));
//   const t = setTimeout(async () => {
//     await bootstrap.shutdown();
//   }, timeout);
//   process.send('startup');
//
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
//
//
// })();
//
