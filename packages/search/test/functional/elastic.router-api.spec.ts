import { expect } from 'chai';
import { suite, test, timeout } from '@testdeck/mocha';
import { __CLASS__, Bootstrap, Injector, XS_P_$COUNT } from '@typexs/base';
import * as path from 'path';
import { ElasticStorageRef } from '../../src/lib/elastic/ElasticStorageRef';
import { ES_host, ES_port } from './config';
import { Client } from '@elastic/elasticsearch';
import * as _ from 'lodash';
import { DataEntity } from './fake_app_controller/entities/DataEntity';
import { SearchEntity } from './fake_app_controller/entities/SearchEntity';
import { ElasticEntityController } from '../../src/lib/elastic/ElasticEntityController';
import { HttpFactory, IHttp } from '@allgemein/http';
import { API_CTRL_STORAGE_FIND_ENTITY, API_CTRL_STORAGE_GET_ENTITY, API_CTRL_STORAGE_METADATA_GET_STORE, WebServer } from '@typexs/server';
import { TestHelper } from './TestHelper';
import { __ID__, __TYPE__, C_ELASTIC_SEARCH, C_SEARCH_INDEX, ES_IDFIELD } from '../../src/lib/Constants';
import { IElasticStorageRefOptions } from '../../src';
import { __NS__ } from '@allgemein/schema-api';
import { ElasticUtils } from '../../src/lib/elastic/ElasticUtils';
import { ElasticMappingUpdater } from '../../src/lib/elastic/mapping/ElasticMappingUpdater';
import { clear } from './testdata';

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
const resolve = TestHelper.root();
const testConfig = [
  {
    app: { path: appdir },
    modules: { paths: [resolve] },
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
      elastic: <IElasticStorageRefOptions>{
        framework: C_SEARCH_INDEX,
        type: C_ELASTIC_SEARCH,
        connectOnStartup: true,
        host: ES_host,
        port: ES_port,
        indexTypes: [
          { index: 'core', entities: ['GreatEntity'] },
          { index: 'data_index', entities: ['DataEntity'] },
          { index: 'search_index', entities: ['SearchEntity'] }
        ]
      }
    }
  }
];


let storageRef: ElasticStorageRef;
let controller: ElasticEntityController;
let client: Client;
let http: IHttp;
let server: WebServer;
const C_DATA_INDEX = ElasticUtils.indexName('data_index');
const C_SEARCH_INDEX_2 = ElasticUtils.indexName('search_index');
const C_CORE_INDEX = ElasticUtils.indexName('core');

@suite('functional/typexs-search/elastic/router-api') @timeout(300000)
class TypexsSearchRouterApi {


  static async before() {
    Bootstrap.reset();

    client = new Client({ node: 'http://' + ES_host + ':' + ES_port });
    await client.ping();
    const updater = new ElasticMappingUpdater(client);
    const words = lorem.split(' ');
    const words2 = lorem2.split(' ');
    await clear(updater);


    bootstrap = Bootstrap
      .setConfigSources([{ type: 'system' }])
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
      d[__ID__] = i + '';
      d[__TYPE__] = 'data_entity';
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
        index: C_DATA_INDEX,
        id: 'data_entity--' + i,
        body: d
      }));

      const s = new SearchEntity();
      s[__ID__] = i + '';
      s[__TYPE__] = 'search_entity';
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
        index: C_SEARCH_INDEX_2,
        id: 'search_entity--' + i,
        body: s
      }));
      await Promise.all(promises);
      await client.indices.refresh({ index: [C_DATA_INDEX, C_SEARCH_INDEX_2] });


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
  async 'get metadata'() {
    const url = 'http://localhost:4500/api' + API_CTRL_STORAGE_METADATA_GET_STORE.replace(':name', 'elastic');
    const response = await http.get(url, { responseType: 'json', passBody: true });
    expect(response).to.be.deep.eq({
      'name': 'elastic',
      'type': 'elastic',
      'framework': 'search-index',
      'options': {
        'framework': 'search-index',
        'type': 'elastic',
        'connectOnStartup': true,
        'host': 'localhost',
        'port': 9200,
        'indexTypes': [
          {
            'index': 'core',
            'entities': [
              'GreatEntity'
            ]
          },
          {
            'index': 'data_index',
            'entities': [
              'DataEntity'
            ]
          },
          {
            'index': 'search_index',
            'entities': [
              'SearchEntity'
            ]
          }
        ],
        'entities': [],
        'name': 'elastic'
      },
      'schema': {
        '$schema': 'http://json-schema.org/draft-07/schema#',
        'definitions': {
          'GreatEntityIdx': {
            'title': 'GreatEntity',
            'type': 'object',
            '$id': '#GreatEntityIdx',
            'allowAutoAppendAllField': false,
            'flexible': true,
            'storage': 'elastic',
            'namespace': 'search-index',
            'properties': {
              'id': {
                'type': 'number',
                'metadata': {
                  'propertyName': 'id',
                  'mode': 'regular',
                  'options': {
                    'type': 'int',
                    'primary': true
                  }
                },
                'tableType': 'column',
                'identifier': true
              },
              'name': {
                'type': 'string',
                'metadata': {
                  'propertyName': 'name',
                  'mode': 'regular',
                  'options': {
                    'type': 'varchar'
                  }
                },
                'tableType': 'column'
              }
            }
          },
          'DataEntityIdx': {
            'title': 'DataEntity',
            'type': 'object',
            '$id': '#DataEntityIdx',
            'allowAutoAppendAllField': false,
            'flexible': true,
            'storage': 'elastic',
            'namespace': 'search-index',
            'properties': {
              'id': {
                'type': 'number',
                'metadata': {
                  'propertyName': 'id',
                  'mode': 'regular',
                  'options': {
                    'type': 'int',
                    'primary': true
                  }
                },
                'tableType': 'column',
                'identifier': true
              },
              'name': {
                'type': 'string',
                'metadata': {
                  'propertyName': 'name',
                  'mode': 'regular',
                  'options': {
                    'type': 'varchar'
                  }
                },
                'tableType': 'column'
              },
              'text': {
                'type': 'string',
                'metadata': {
                  'propertyName': 'text',
                  'mode': 'regular',
                  'options': {
                    'type': 'varchar'
                  }
                },
                'tableType': 'column'
              },
              'someNumber': {
                'type': 'number',
                'metadata': {
                  'propertyName': 'someNumber',
                  'mode': 'regular',
                  'options': {
                    'type': 'int'
                  }
                },
                'tableType': 'column'
              },
              'date': {
                'type': 'string',
                'format': 'date-time',
                'metadata': {
                  'propertyName': 'date',
                  'mode': 'regular',
                  'options': {
                    'type': 'datetime'
                  }
                },
                'tableType': 'column'
              },
              'enabled': {
                'type': 'boolean',
                'metadata': {
                  'propertyName': 'enabled',
                  'mode': 'regular',
                  'options': {
                    'type': 'boolean'
                  }
                },
                'tableType': 'column'
              }
            }
          },
          'SearchEntityIdx': {
            'title': 'SearchEntity',
            'type': 'object',
            '$id': '#SearchEntityIdx',
            'allowAutoAppendAllField': false,
            'flexible': true,
            'storage': 'elastic',
            'namespace': 'search-index',
            'properties': {
              'id': {
                'type': 'number',
                'metadata': {
                  'propertyName': 'id',
                  'mode': 'regular',
                  'options': {
                    'type': 'int',
                    'primary': true
                  }
                },
                'tableType': 'column',
                'identifier': true
              },
              'search': {
                'type': 'string',
                'metadata': {
                  'propertyName': 'search',
                  'mode': 'regular',
                  'options': {
                    'type': 'varchar'
                  }
                },
                'tableType': 'column'
              },
              'textus': {
                'type': 'string',
                'metadata': {
                  'propertyName': 'textus',
                  'mode': 'regular',
                  'options': {
                    'type': 'varchar'
                  }
                },
                'tableType': 'column'
              },
              'numerus': {
                'type': 'number',
                'metadata': {
                  'propertyName': 'numerus',
                  'mode': 'regular',
                  'options': {
                    'type': 'int'
                  }
                },
                'tableType': 'column'
              },
              'datus': {
                'type': 'string',
                'format': 'date-time',
                'metadata': {
                  'propertyName': 'datus',
                  'mode': 'regular',
                  'options': {
                    'type': 'datetime'
                  }
                },
                'tableType': 'column'
              },
              'enabled': {
                'type': 'boolean',
                'metadata': {
                  'propertyName': 'enabled',
                  'mode': 'regular',
                  'options': {
                    'type': 'boolean'
                  }
                },
                'tableType': 'column'
              }
            }
          }
        },
        'anyOf': [
          {
            '$ref': '#/definitions/GreatEntityIdx'
          },
          {
            '$ref': '#/definitions/DataEntityIdx'
          },
          {
            '$ref': '#/definitions/SearchEntityIdx'
          }
        ]
      }
    });
  }


  @test
  async 'find entities by given type'() {
    const url = 'http://localhost:4500/api' + API_CTRL_STORAGE_FIND_ENTITY.replace(':name', 'SearchEntityIdx');
    const response = await http.get(url, { responseType: 'json', passBody: true });
    expect(response[XS_P_$COUNT]).to.be.eq(40);
    expect(response['entities']).to.have.length(40);
    expect(response['entities'][0]).to.be.deep.eq(
      {
        'id': 0,
        'search': 'ipsum',
        // eslint-disable-next-line max-len
        'textus': 'ipsum carusus dolor varius sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.',
        'numerus': 0,
        'datus': '2019-12-30T23:00:00.000Z',
        'enabled': false,
        '$score': 1,
        '$label': '0',
        '$url': '/storage/entity/search_entity_idx/0',
        [__CLASS__]: 'SearchEntityIdx',
        [__NS__]: C_SEARCH_INDEX,
        [ES_IDFIELD]: 'search_entity--0',
        [__ID__]: '0',
        [__TYPE__]: 'search_entity'
      }
    );
  }

  @test
  async 'find entities over all'() {
    const url = 'http://localhost:4500/api' + API_CTRL_STORAGE_FIND_ENTITY.replace(':name', '*');
    const response = await http.get(url, { responseType: 'json', passBody: true });
    expect(response[XS_P_$COUNT]).to.be.eq(80);
    expect(response['entities']).to.have.length(50);
  }

  @test.pending()
  async 'find entities - throwing error'() {
  }


  @test
  async 'get entity'() {
    const url = 'http://localhost:4500/api' + API_CTRL_STORAGE_GET_ENTITY
      .replace(':name', 'SearchEntityIdx')
      .replace(':id', '0');

    const response = await http.get(url, { responseType: 'json', passBody: true });
    expect(response).to.be.deep.eq({
      '__ID__': '0',
      '__TYPE__': 'search_entity',
      'id': 0,
      'datus': '2019-12-30T23:00:00.000Z',
      'search': 'ipsum',
      'textus': 'ipsum carusus dolor varius sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod ' +
        'tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam ' +
        'et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor ' +
        'sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut ' +
        'labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. ' +
        'Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.',
      'numerus': 0,
      'enabled': false,
      '_id': 'search_entity--0',
      '$score': 1,
      '$url': '/storage/entity/search_entity_idx/0',
      '$label': '0',
      '__CLASS__': 'SearchEntityIdx',
      '__NS__': 'search-index'

    });
  }


  @test.pending()
  async 'save entity'() {

  }

  @test.pending()
  async 'update entity'() {

  }

  @test.pending()
  async 'delete entity'() {

  }
}
