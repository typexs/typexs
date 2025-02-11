import { suite, test, timeout } from '@testdeck/mocha';
import { Bootstrap, Config, Injector } from '@typexs/base';
import { API_CTRL_SYSTEM_WORKERS, C_API, K_ROUTE_CONTROLLER } from '../../../src/libs/Constants';
import { expect } from 'chai';

import { TestHelper } from '../TestHelper';
import { redis_host, redis_port, TEST_STORAGE_OPTIONS } from '../config';
import { IEventBusConfiguration } from '@allgemein/eventbus';
import { HttpFactory, IHttp } from '@allgemein/http';
import { WebServer } from '../../../src/libs/web/WebServer';
import { clone } from '@typexs/generic';


const LOG_EVENT = TestHelper.logEnable(false);

const settingsTemplate: any = {
  storage: {
    default: TEST_STORAGE_OPTIONS
  },

  app: {name: 'demo', path: __dirname + '/../../../../..', nodeId: 'server'},

  logging: {
    enable: LOG_EVENT,
    level: 'debug',
    transports: [{console: {}}],
  },



  modules: {
    paths: [
      TestHelper.root()
    ],
    disableCache: true,
    include: [
      '**/@allgemein{,/eventbus}*',
      '**/@typexs{,/base}*',
      '**/@typexs{,/server}*'
    ],

  },

  server: {
    default: {
      type: 'web',
      framework: 'express',
      host: 'localhost',
      port: 4500,

      routes: [{
        type: K_ROUTE_CONTROLLER,
        context: 'api',
        routePrefix: 'api'
      }]
    }
  },
  eventbus: {default: <IEventBusConfiguration>{adapter: 'redis', extra: {host: redis_host, port: redis_port, unref: true}}},
  // workers: {access: [{name: 'TaskQueueWorker', access: 'allow'}]}

};

let bootstrap: Bootstrap = null;
let server: WebServer = null;
let http: IHttp = null;

@suite('functional/controllers/system_node_info_controller - local worker') @timeout(300000)
class RuntimeInfoControllerSpec {


  static async before() {
    const settings = clone(settingsTemplate);
    http = HttpFactory.create();

    bootstrap = Bootstrap
      .setConfigSources([{type: 'system'}])
      .configure(settings)
      .activateErrorHandling()
      .activateLogger();

    await bootstrap.prepareRuntime();
    await bootstrap.activateStorage();
    await bootstrap.startup();

    server = Injector.get('server.default');
    await server.start();
  }

  static async after() {
    if (server) {
      await server.stop();
    }
    await bootstrap.shutdown();
    Bootstrap.reset();
    Injector.reset();
    Config.clear();
  }


  // TODO add fake worker to check this
  // @test
  // async 'list workers'() {
  //   const url = server.url() + '/' + C_API;
  //   let res: any = await http.get(url + API_CTRL_SYSTEM_WORKERS, {responseType: 'json'});
  //   expect(res).to.not.be.null;
  //   res = res.body;
  //   expect(res).to.have.length(1);
  //   expect(res[0]).to.deep.eq({
  //     name: 'task_queue_worker',
  //     className: 'TaskQueueWorker',
  //     statistics: {
  //       stats: {all: 0, done: 0, running: 0, enqueued: 0, active: 0},
  //       paused: false,
  //       idle: true,
  //       occupied: false,
  //       running: false
  //     }
  //   });
  // }
  //

}
