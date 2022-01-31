import { RegistryFactory } from '@allgemein/schema-api';
import { suite, test } from '@testdeck/mocha';
import { ES_host, ES_port } from './config';
import path from 'path';
import { TestHelper } from './TestHelper';
import { IElasticStorageRefOptions } from '../../src/lib/elastic/IElasticStorageRefOptions';
import { C_ELASTIC_SEARCH, C_SEARCH_INDEX } from '../../src/lib/Constants';
import { Bootstrap, Injector } from '@typexs/base';
import { Client } from '@elastic/elasticsearch';
import { IndexEntityRegistry } from '../../src/lib/registry/IndexEntityRegistry';
import { EntityWithElasticTypes } from './scenarios/app_with_mapping/entities/EntityWithElasticTypes';
import { expect } from 'chai';
import { EntityWithReference } from './scenarios/app_with_mapping/entities/EntityWithReference';
import { ElasticStorageRef } from '../../src/lib/elastic/ElasticStorageRef';
import { Y } from './helper/Constants.mapping';

let bootstrap: Bootstrap = null;
const appdir = path.join(__dirname, 'scenarios', 'app_with_mapping');
const resolve = TestHelper.root();
const testConfig = [
  {
    app: { path: appdir },
    modules: {
      paths: [resolve],
      disableCache: true
    },
    logging: {
      enable: false,
      level: 'debug',
      transports: [
        {
          console: {}
        }
      ]
    },
    storage: {
      default: {
        type: 'sqlite',
        database: ':memory:'
      },
      elastic: <IElasticStorageRefOptions>{
        framework: C_SEARCH_INDEX,
        type: C_ELASTIC_SEARCH,
        host: ES_host,
        port: ES_port,
        indexTypes: [
          {
            index: 'core',
            entities: [
              'EntityWithElasticTypes', 'EntityWithReference'
            ]
          }
        ]
      }
    }
  }
];

const beforeCall = async function(cfg: any) {
  const client = new Client({ node: 'http://' + ES_host + ':' + ES_port });
  if ((await client.indices.exists({ index: 'core' })).body) {
    await client.indices.delete({ index: 'core', ignore_unavailable: true });
  }
  await client.close();

  // Bootstrap.reset();
  bootstrap = Bootstrap
    .setConfigSources([{ type: 'system' }])
    .configure(cfg);

  bootstrap.activateErrorHandling();
  bootstrap.activateLogger();
  await bootstrap.prepareRuntime();
  await bootstrap.activateStorage();
  await bootstrap.startup();

};


@suite('functional/elastic/mapping - startup')
class TypexsSearchElasticMappingSpec {

  static before() {
    RegistryFactory.register(C_SEARCH_INDEX, IndexEntityRegistry);
    RegistryFactory.register(/^search-index\..*/, IndexEntityRegistry);
  }

  before() {
    Bootstrap.reset();
  }


  async after() {
    if (bootstrap) {
      await bootstrap.shutdown();
      await TestHelper.wait(50);
    }
    Bootstrap.reset();
  }


  @test
  async 'elastic mapping generation'() {
    await beforeCall(testConfig[0]);
    const storageRef = Injector.get<ElasticStorageRef>('storage.elastic');
    const mappingData = await storageRef.getIndexCreateData('core');
    expect(mappingData.properties).to.exist;
    expect(mappingData.properties).to.be.deep.include(Y);
  }


}

