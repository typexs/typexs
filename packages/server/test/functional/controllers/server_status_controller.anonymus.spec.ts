import { suite, test, timeout } from '@testdeck/mocha';
import { Bootstrap, Config, Injector } from '@typexs/base';
import {
  API_CTRL_SERVER_CONFIG,
  API_CTRL_SERVER_CONFIG_KEY,
  API_CTRL_SERVER_ROUTES,
  API_CTRL_SYSTEM_RUNTIME_REMOTE_INFOS,
  C_API,
  K_CONFIG_ANONYMOUS_ALLOW,
  K_ROUTE_CONTROLLER,
  PERMISSION_ALLOW_RUNTIME_REMOTE_INFOS_VIEW
} from '../../../src/libs/Constants';

import { TestHelper } from '../TestHelper';
import { TEST_STORAGE_OPTIONS } from '../config';
import { HttpFactory, IHttp } from '@allgemein/http';

import { expect } from 'chai';
import { WebServer } from '../../../src/libs/web/WebServer';
import { clone, find } from '@typexs/generic';


const LOG_EVENT = TestHelper.logEnable(false);

const settingsTemplate: any = {
  storage: {
    default: TEST_STORAGE_OPTIONS
  },

  app: { name: 'demo', path: __dirname + '/../../..', nodeId: 'server' },

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
      '**/@typexs{,/server}*'
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
let url: string = null;

@suite('functional/controllers/server_status_controller - anonymous') @timeout(300000)
class ServerStatusControllerSpec {


  static async before() {
    Bootstrap.reset();
    const settings = clone(settingsTemplate);
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
    url = server.url() + '/' + C_API;
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


  @test
  async 'list config (in anonymous mode)'() {
    Config.set(K_CONFIG_ANONYMOUS_ALLOW, true);

    expect(Config.get(K_CONFIG_ANONYMOUS_ALLOW)).to.be.true;

    const baseConfig = await http.get(url + API_CTRL_SERVER_CONFIG, { responseType: 'json', passBody: true }) as any;
    const compare = clone(settingsTemplate);

    compare.storage.default.name = 'default';

    delete compare.storage.default.entities;
    delete baseConfig.storage.default.entities;
    delete baseConfig.storage.default.supportSchemaApi;
    // added for sqlite settings
    compare.storage.default.connection = { read: 0, write: 1 };
    expect(baseConfig.storage).to.deep.include(compare.storage);

    expect(baseConfig.server).to.have.deep.eq({
      'default': {
        '_debug': false,
        'fn': 'root',
        'framework': 'express',
        'host': 'localhost',
        'ip': '127.0.0.1',
        'port': 4500,
        'protocol': 'http',
        'routes': [
          {
            'authorizationChecker': '',
            'classTransformer': false,
            'context': 'api',
            'controllers': [
              'FileSystemAPIController',
              'RegistryAPIController',
              'ServerStatusAPIController',
              'SystemNodeInfoAPIController'
            ],
            'currentUserChecker': '',
            'limit': '10mb',
            'middlewares': [],
            'routePrefix': 'api',
            'type': 'routing_controller'
          }
        ],
        'stall': 0,
        'timeout': 60000,
        'type': 'web'
      }
    });
  }


  @test
  async 'list config (forbid anonymous)'() {
    Config.set(K_CONFIG_ANONYMOUS_ALLOW, false);
    expect(Config.get(K_CONFIG_ANONYMOUS_ALLOW)).to.be.false;
    try {
      const results = await http.get(url + API_CTRL_SERVER_CONFIG, { responseType: 'json', passBody: true });
      expect(true).to.be.false;
    } catch (err) {
      expect(err.response.statusCode).to.be.eq(403);
      expect(err.message).to.be.eq('Response code 403 (Forbidden)');
      expect(err.response.body.message).to.be.eq('Access not allowed');
    }
  }


  @test
  async 'list config by key (in anonymous mode)'() {
    // add config setting
    Config.set(K_CONFIG_ANONYMOUS_ALLOW, true);

    expect(Config.get(K_CONFIG_ANONYMOUS_ALLOW)).to.be.true;

    const baseConfig = await http.get(url + API_CTRL_SERVER_CONFIG_KEY.replace(':key', 'server.default'), {
      responseType: 'json',
      passBody: true
    }) as any;

    expect(baseConfig).to.have.deep.eq({
      '_debug': false,
      'fn': 'root',
      'framework': 'express',
      'host': 'localhost',
      'ip': '127.0.0.1',
      'port': 4500,
      'protocol': 'http',
      'routes': [
        {
          'authorizationChecker': '',
          'classTransformer': false,
          'context': 'api',
          'controllers': [
            // 'DistributedStorageAPIController',
            'FileSystemAPIController',
            'RegistryAPIController',
            'ServerStatusAPIController',
            'SystemNodeInfoAPIController'
          ],
          'currentUserChecker': '',
          'limit': '10mb',
          'middlewares': [],
          'routePrefix': 'api',
          'type': 'routing_controller'
        }
      ],
      'stall': 0,
      'timeout': 60000,
      'type': 'web'
    });
  }


  @test
  async 'list routes (in anonymous mode)'() {
    const response = await http.get(url + API_CTRL_SERVER_ROUTES, { responseType: 'json', passBody: true });
    expect(response).to.not.be.null;

    expect(response).to.have.length.greaterThan(4);
    expect(find(response, { controllerMethod: 'listRoutes' })).to.deep.eq({
      context: 'api',
      route: '/' + C_API + API_CTRL_SERVER_ROUTES,
      method: 'get',
      params: [{
        'index': 0,
        'parse': false
      }],
      controller: 'ServerStatusAPIController',
      controllerMethod: 'listRoutes',
      permissions: null,
      authorized: false
    });

    expect(find(response, { controllerMethod: 'nodesInfo' })).to.deep.eq({
      context: 'api',
      route: '/' + C_API + API_CTRL_SYSTEM_RUNTIME_REMOTE_INFOS,
      method: 'get',
      params: [
        {
          'index': 0,
          'name': 'nodeIds',
          // 'parse': false
          // 'required': true
        }
      ],
      controller: 'SystemNodeInfoAPIController',
      controllerMethod: 'nodesInfo',
      permissions: [PERMISSION_ALLOW_RUNTIME_REMOTE_INFOS_VIEW],
      authorized: true
    });
  }


}
