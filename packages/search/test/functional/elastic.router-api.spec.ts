import {expect} from 'chai';
import {suite, test, timeout} from '@testdeck/mocha';
import {Bootstrap, Injector, XS_P_$COUNT} from '@typexs/base';
import * as path from 'path';
import {ElasticStorageRef} from '../../src/lib/elastic/ElasticStorageRef';
import {ES_host, ES_port} from './config';
import {Client} from '@elastic/elasticsearch';
import * as _ from 'lodash';
import {DataEntity} from './fake_app_controller/entities/DataEntity';
import {SearchEntity} from './fake_app_controller/entities/SearchEntity';
import {ElasticEntityController} from '../../src/lib/elastic/ElasticEntityController';
import {HttpFactory, IHttp} from '@allgemein/http';
import {API_CTRL_STORAGE_FIND_ENTITY, WebServer} from '@typexs/server';

const lorem = 'lorem ipsum carusus dolor varius sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod ' +
  'tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero ' +
  'eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea ' +
  'takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur ' +
  'sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna ' +
  'aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea ' +
  'rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.';

const lorem2 = 'lorem ipsum dolor varius harsut sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod ' +
  'tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero ' +
  'eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea ' +
  'takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur ' +
  'sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna ' +
  'aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea ' +
  'rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.';

let bootstrap: Bootstrap = null;
const appdir = path.join(__dirname, 'fake_app_controller');
const resolve = __dirname + '/../../../../..';
const testConfig = [
  {
    app: {path: appdir},
    modules: {paths: [resolve]},
    logging: {
      enable: false,
      level: 'debug'
    },
    server: {
      default: {
        framework: 'express',
        type: 'web',
        host: 'localhost',
        port: 4500,

        routes: [
          {
            type: 'routing_controller',
            context: 'api',
            routePrefix: 'api',
            access: [
              {
                access: 'deny',
                name: '*'
              },
              {
                access: 'allow',
                name: 'StorageAPIController'
              }
            ]
          }
        ]
      }
    },
    storage: {
      default: {
        type: 'sqlite',
        database: ':memory:'
      },
      elastic: <any>{
        framework: 'index',
        type: 'elastic',
        connectOnStartup: true,
        host: ES_host,
        port: ES_port,
        indexTypes: [
          {index: 'core', entities: ['GreatEntity']},
          {index: 'data_index', entities: ['DataEntity']},
          {index: 'search_index', entities: ['SearchEntity']}
        ]
      }
    }
  },
];


let storageRef: ElasticStorageRef;
let controller: ElasticEntityController;
let client: Client;
let http: IHttp;
let server: WebServer;

@suite('functional/typexs-search/elastic/router-api') @timeout(300000)
class TypexsSearchRouterApi {


  static async before() {
    Bootstrap.reset();

    client = new Client({node: 'http://' + ES_host + ':' + ES_port});
    await client.ping();

    const words = lorem.split(' ');
    const words2 = lorem2.split(' ');
    const existsData = await client.indices.exists({index: 'data_index'});
    const existsSearch = await client.indices.exists({index: 'search_index'});
    if (existsData.body) {
      await client.indices.delete({index: 'data_index'});
    }
    if (existsSearch.body) {
      await client.indices.delete({index: 'search_index'});
    }
    // delete index
    const {body} = await client.indices.exists({index: 'core'});
    if (body) {
      await client.indices.delete({index: 'core'});
    }


    bootstrap = Bootstrap
      .setConfigSources([{type: 'system'}])
      .configure(testConfig.shift());

    bootstrap.activateErrorHandling();
    bootstrap.activateLogger();
    await bootstrap.prepareRuntime();
    await bootstrap.activateStorage();
    await bootstrap.startup();

    storageRef = Injector.get<ElasticStorageRef>('storage.elastic');
    controller = storageRef.getController();

    const promises = [];
    for (const i of _.range(0, 40)) {
      const d = new DataEntity();
      d['__id'] = i + '';
      d['__type'] = 'data_entity';
      d.id = i;
      d.date = new Date(2020, i % 12, i % 30);
      d.name = words[i];
      d.text = words.slice(i).join(' ');
      d.someNumber = i * 123;
      d.enabled = i % 2 === 0;
      if (d.enabled) {
        d.name = words2[i];
        d.text = words2.slice(i).join(' ');
      }
      promises.push(client.index({
        index: 'data_index',
        id: 'data_entity--' + i,
        body: d
      }));

      const s = new SearchEntity();
      s['__id'] = i + '';
      s['__type'] = 'search_entity';
      s.id = i;
      s.datus = new Date(2020, i % 12, i % 30);
      s.search = words[i + 1];
      s.textus = words.slice(i + 1).join(' ');
      s.numerus = i * 43;
      s.enabled = i % 2 === 1;
      if (s.enabled) {
        s.search = words2[i + 1];
        s.textus = words2.slice(i + 1).join(' ');
      }
      promises.push(client.index({
        index: 'search_index',
        id: 'search_entity--' + i,
        body: s
      }));
      await Promise.all(promises);
      await client.indices.refresh({index: ['data_index', 'search_index']});


    }

    server = Injector.get('server.default');
    await server.start();
    http = HttpFactory.create();
  }

  static async after() {
    if (server) {
      await server.stop();
    }
    if (bootstrap) {
      await bootstrap.shutdown();
      // await TestHelper.wait(500);
    }

    Bootstrap.reset();
  }


  @test
  async 'find entities by given type'() {
    const url = 'http://localhost:4500/api' + API_CTRL_STORAGE_FIND_ENTITY.replace(':name', 'SearchEntityIdx');
    const response = await http.get(url, {responseType: 'json', passBody: true});
    expect(response[XS_P_$COUNT]).to.be.eq(40);
    expect(response['entities']).to.have.length(40);
    expect(response['entities'][0]).to.be.deep.eq(
      {
        'id': 0,
        'search': 'ipsum',
        'textus': 'ipsum carusus dolor varius sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.',
        'numerus': 0,
        'datus': '2019-12-30T23:00:00.000Z',
        'enabled': false,
        '$score': 1,
        '$label': '0',
        '$url': '/storage/entity/search_entity_idx/0',
        '__class__': 'SearchEntityIdx',
        '__registry__': 'index',
        '_id': 'search_entity--0',
        '__id': '0',
        '__type': 'search_entity'
      }
    );
  }

  @test
  async 'find entities over all'() {
    const url = 'http://localhost:4500/api' + API_CTRL_STORAGE_FIND_ENTITY.replace(':name', '*');
    const response = await http.get(url, {responseType: 'json', passBody: true});
    expect(response[XS_P_$COUNT]).to.be.eq(80);
    expect(response['entities']).to.have.length(50);
  }

  @test.skip()
  async 'get entity'() {

  }

  @test.skip()
  async 'save entity'() {

  }

  @test.skip()
  async 'update entity'() {

  }

  @test.skip()
  async 'delete entity'() {

  }
}
