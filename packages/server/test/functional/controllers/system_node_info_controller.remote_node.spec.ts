import {suite, test, timeout} from '@testdeck/mocha';
import {Bootstrap, Config, Injector} from '@typexs/base';
import {API_CTRL_SYSTEM_RUNTIME_NODES, C_API, K_ROUTE_CONTROLLER} from '../../../src/libs/Constants';
import {expect} from 'chai';
import * as _ from 'lodash';
import {SpawnHandle} from '@typexs/testing';
import {TestHelper} from '../TestHelper';
import {TEST_STORAGE_OPTIONS} from '../config';
import {IEventBusConfiguration} from '@allgemein/eventbus';
import {HttpFactory, IHttp} from '@allgemein/http';
import {WebServer} from '../../../src/libs/web/WebServer';

const LOG_EVENT = TestHelper.logEnable(false);

const settingsTemplate: any = {
  storage: {
    default: TEST_STORAGE_OPTIONS
  },

  app: {name: 'demo', path: TestHelper.root(), nodeId: 'server'},

  modules: {
    paths: [
      TestHelper.root()
    ],
    disableCache: true,
    include: [
      '**/@allgemein{,/eventbus}*',
      '**/@typexs{,/base}*',
      '**/@typexs{,/server}*',
      '**/fake_app_node*'
    ],

  },

  logging: {
    enable: LOG_EVENT,
    level: 'debug',
    transports: [{console: {}}],
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
  eventbus: {default: <IEventBusConfiguration>{adapter: 'redis', extra: {host: '127.0.0.1', port: 6379, unref: true}}},

};

let bootstrap: Bootstrap = null;
let server: WebServer = null;
let http: IHttp = null;
let p: SpawnHandle = null;

@suite('functional/controllers/system_node_info_controller - remote node') @timeout(300000)
class RuntimeInfoControllerSpec {


  static async before() {
    const settings = _.clone(settingsTemplate);
    http = HttpFactory.create();

    bootstrap = Bootstrap
      .setConfigSources([{type: 'system'}])
      .configure(settings)
      .activateErrorHandling()
      .activateLogger();

    await bootstrap.prepareRuntime();
    await bootstrap.activateStorage();
    await bootstrap.startup();
    p = SpawnHandle.do(__dirname + '/fake_app_node/node.ts').start(LOG_EVENT);
    await p.started;

    server = Injector.get('server.default');
    await server.start();
  }

  static async after() {
    if (server) {
      await server.stop();
    }
    await bootstrap.shutdown();

    if (p) {
      p.shutdown();
      await p.done;

    }

    Bootstrap.reset();
    Injector.reset();
    Config.clear();
  }


  @test
  async 'get nodes'() {
    const url = server.url() + '/' + C_API;

    let res: any = await http.get(url + API_CTRL_SYSTEM_RUNTIME_NODES, {responseType: 'json'});
    expect(res).to.not.be.null;
    res = res.body;

    expect(res).to.not.be.null;
    expect(res).to.have.length(1);
    expect(res.map((x: any) => x.nodeId)).to.deep.eq(['fake_app_node']);
  }


}
