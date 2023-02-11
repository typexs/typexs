import { suite, test } from '@testdeck/mocha';
import { Bootstrap, Injector, ITypeOrmStorageRefOptions } from '@typexs/base';
import { C_API, K_ROUTE_CONTROLLER, WebServer } from '@typexs/server';
import { expect } from 'chai';
import { clone } from 'lodash';
import { TestHelper } from '@typexs/testing';
import { TEST_STORAGE_OPTIONS } from '../config';
import { HttpFactory, IHttp } from '@allgemein/http';
import { API_CTRL_SYSTEM_STORAGE_ACTIVE, API_CTRL_SYSTEM_STORAGE_TEST, API_CTRL_SYSTEM_STORAGES } from '../../../src/lib/Constants';
import { StorageSetting } from '../../../src/entities/storage/StorageSetting';
import { StorageLoader } from '../../../src/lib/StorageLoader';


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

const refOptions: ITypeOrmStorageRefOptions & any = {
  name: 'api_test',
  framework: 'typeorm',
  type: 'sqlite',
  database: ':memory:',
  supportSchemaApi: true,
  synchronize: true,
  entities: [
    {
      $schema: 'http://json-schema.org/draft-07/schema#',
      definitions: {
        'DynaEntity': {
          'title': 'DynaEntity',
          'type': 'object',
          'metadata': {
            'type': 'regular'
          },
          'properties': {
            'id': {
              'type': 'Number',
              identifier: true,
              generated: true
            },
            'someName': {
              'type': 'String'
            },
            'someBool': {
              'type': 'boolean'
            },
            'someNr': {
              'type': 'number'
            }
          }
        }
      },
      $ref: '#/definitions/DynaEntity'
    }
  ]
};


let bootstrap: Bootstrap = null;
let server: WebServer = null;
let http: IHttp = null;
let storageSetting: StorageSetting = null;

@suite('functional/controllers/system_storage_info_controller')
class SystemStorageInfoControllerSpec {


  static async before() {
    const settings = clone(settingsTemplate);

    settings.storage.default.supportSchemaApi = true;
    settings.storage.default.extends = ['storage'];

    http = HttpFactory.create();

    bootstrap = Bootstrap
      .setConfigSources([{ type: 'system' }])
      .configure(settings)
      .activateErrorHandling()
      .activateLogger();

    await bootstrap.prepareRuntime();
    await bootstrap.activateStorage();
    await bootstrap.startup();

    storageSetting = new StorageSetting();
    storageSetting.type = refOptions.type;
    storageSetting.framework = refOptions.framework;
    storageSetting.name = refOptions.name;
    storageSetting.active = false;
    storageSetting.options = refOptions;

    const loader = Injector.get(StorageLoader);
    storageSetting = await loader.getStorageRef().getController().save(storageSetting);

    server = Injector.get('server.default');
    await server.start();
  }

  static async after() {
    if (server) {
      await server.stop();
    }
    await bootstrap.shutdown();
    Bootstrap.reset();
    // Injector.reset();
    // Config.clear();
  }


  @test
  async 'list storages'() {
    const url = server.url() + '/' + C_API;
    let res: any = await http.get(url + API_CTRL_SYSTEM_STORAGES, { responseType: 'json' });
    expect(res.body).to.not.be.null;
    res = res.body;
    expect(res).to.have.length(2);
    let entry = res.shift();
    let compare = clone(settingsTemplate);
    compare.storage.default.name = 'default';
    // compare.storage.default.entities = [];
    expect(entry).to.have.deep.include(compare.storage.default);
    entry = res.shift();
    compare = clone(refOptions);
    // compare.storage.default.entities = [];
    expect(entry).to.have.deep.include(compare);
  }

  @test
  async 'test storage settings'() {
    const url = server.url() + '/' + C_API + API_CTRL_SYSTEM_STORAGE_TEST.replace(':idOrName', storageSetting.name);
    const res = await http.get(url, { responseType: 'json', passBody: true });
    expect(res).to.be.true;
  }

  @test
  async 'activate storage'() {
    const loader = Injector.get(StorageLoader);
    const ctrl = loader.getStorageRef().getController();
    storageSetting = await ctrl.findOne(StorageSetting, { id: storageSetting.id });
    expect(storageSetting.active).to.be.false;

    const url = server.url() + '/' + C_API + API_CTRL_SYSTEM_STORAGE_ACTIVE.replace(':idOrName', storageSetting.name);
    const res = await http.get(url, { responseType: 'json', passBody: true });
    expect(res).to.be.true;

    storageSetting = await ctrl.findOne(StorageSetting, { id: storageSetting.id });
    expect(storageSetting.active).to.be.true;
  }


  @test.pending
  'get single storage'() {
  }

}
