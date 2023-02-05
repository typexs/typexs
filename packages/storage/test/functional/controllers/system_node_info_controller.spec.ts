import { suite, test, timeout } from '@testdeck/mocha';
import { Bootstrap, Config, Injector } from '@typexs/base';
import { C_API, K_ROUTE_CONTROLLER } from '@typexs/server';
import { expect } from 'chai';

import * as _ from 'lodash';
import { TestHelper } from '@typexs/testing';
import { TEST_STORAGE_OPTIONS } from '../config';
import { HttpFactory, IHttp } from '@allgemein/http';
import { WebServer } from '@typexs/server';
import { API_CTRL_SYSTEM_STORAGES } from '../../../src/lib/Constants';


const LOG_EVENT = TestHelper.logEnable(false);

const settingsTemplate: any = {
  storage: {
    default: TEST_STORAGE_OPTIONS
  },

  app: { name: 'demo', path: __dirname + '/../../../../..', nodeId: 'server' },

  logging: {
    enable: LOG_EVENT,
    level: 'debug',
    transports: [{ console: {} }]
  },


  modules: {
    paths: [
      TestHelper.root()
    ],
    disableCache: true,
    include: [
      '**/@allgemein{,/eventbus}*',
      '**/@typexs{,/base}*',
      '**/@typexs{,/server}*',
      '**/@typexs{,/storage}*'
    ]

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
  }

};

let bootstrap: Bootstrap = null;
let server: WebServer = null;
let http: IHttp = null;

@suite('functional/controllers/system_node_info_controller') @timeout(300000)
class RuntimeInfoControllerSpec {


  static async before() {
    const settings = _.clone(settingsTemplate);
    http = HttpFactory.create();

    bootstrap = Bootstrap
      .setConfigSources([{ type: 'system' }])
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


  @test @timeout(300000)
  async 'list storages'() {
    const url = server.url() + '/' + C_API;
    let res: any = await http.get(url + API_CTRL_SYSTEM_STORAGES, { responseType: 'json' });
    expect(res.body).to.not.be.null;
    res = res.body;
    expect(res).to.have.length(1);
    res = res.shift();
    const compare = _.clone(settingsTemplate);
    compare.storage.default.name = 'default';
    // compare.storage.default.entities = [];
    expect(res).to.have.deep.include(compare.storage.default);
  }


}
