
import { suite, test } from '@testdeck/mocha';
import { expect } from 'chai';
import { Bootstrap, Injector, Storage } from '@typexs/base';
import * as path from 'path';
import { join } from 'path';
import { IElasticStorageRefOptions } from '../../src/lib/elastic/IElasticStorageRefOptions';
import { ElasticStorageRef } from '../../src/lib/elastic/ElasticStorageRef';
import { Client } from '@elastic/elasticsearch';
import { ES_host, ES_port } from './config';
import { IndexProcessingWorker } from '../../src/workers/IndexProcessingWorker';
import { IndexRuntimeStatus } from '../../src/lib/IndexRuntimeStatus';
import { TestHelper } from './TestHelper';
import { C_ELASTIC_SEARCH, C_SEARCH_INDEX } from '../../src/lib/Constants';


let bootstrap: Bootstrap = null;
const appdir = path.join(__dirname, 'fake_app');
const resolve = TestHelper.root();
const testConfig = [
  {
    app: { path: appdir },
    modules: {
      paths: [resolve],
      disableCache: true

    },
    logging: {
      enable: false
    },
    storage: {
      elastic: <IElasticStorageRefOptions>{
        framework: C_SEARCH_INDEX,
        type: C_ELASTIC_SEARCH,
        host: ES_host,
        port: ES_port

      }
    }
  },
  {
    app: { path: appdir },
    modules: { paths: [resolve], disableCache: true },
    logging: {
      enable: false,
      level: 'debug'
    },
    storage: {
      default: {
        type: 'sqlite',
        database: ':memory:'
      },
      elastic: <any>{
        framework: C_SEARCH_INDEX,
        type: C_ELASTIC_SEARCH,
        host: ES_host,
        port: ES_port,
        indexTypes: [
          { index: 'core', entities: ['TestEntity'] }
        ]
      }
    }
  },
  {
    app: { path: appdir },
    modules: { paths: [resolve], disableCache: true },
    logging: {
      enable: false,
      level: 'debug'
    },
    storage: {
      default: {
        type: 'sqlite',
        database: ':memory:'
      },
      elastic: <any>{
        framework: C_SEARCH_INDEX,
        type: C_ELASTIC_SEARCH,
        host: ES_host,
        port: ES_port,
        indexTypes: [
          { entities: ['TestEntity'] }
        ]
      }
    }
  },
  {
    app: { path: appdir },
    modules: { paths: [resolve], disableCache: true },
    logging: {
      enable: false,
      level: 'debug'
    },
    storage: {
      default: {
        type: 'sqlite',
        database: ':memory:'
      },
      elastic: <any>{
        framework: C_SEARCH_INDEX,
        type: C_ELASTIC_SEARCH,
        host: ES_host,
        port: ES_port,
        indexTypes: [
          { entities: ['TestEntity', 'RegistryEntity'] }
        ]
      }
    }
  },
  {
    app: { path: appdir },
    modules: { paths: [resolve], disableCache: true },
    logging: {
      enable: false,
      level: 'debug'
    },
    storage: {
      default: {
        type: 'sqlite',
        database: ':memory:'
      },
      elastic: <any>{
        framework: C_SEARCH_INDEX,
        type: C_ELASTIC_SEARCH,
        host: ES_host,
        port: ES_port,
        indexTypes: [
          { entities: ['TestEntity', 'RegistryEntity'] }
        ]
      }
    },
    workers: {
      access: [
        {
          name: IndexProcessingWorker.name,
          access: 'allow'
        }
      ]
    }
  },
  // Nr. 5: use @typexs/entity for entity management
  {
    app: { path: join(__dirname, 'scenarios', 'app_with_entities') },
    modules: { paths: [resolve], disableCache: true },
    logging: {
      enable: false,
      level: 'debug'
    },
    storage: {
      default: {
        type: 'sqlite',
        database: ':memory:'
      },
      elastic: <any>{
        framework: C_SEARCH_INDEX,
        type: C_ELASTIC_SEARCH,
        host: ES_host,
        port: ES_port,
        indexTypes: [
          { entities: ['EntityBySchemaApi'] }
        ]
      }
    },
    workers: {
      access: [
        {
          name: IndexProcessingWorker.name,
          access: 'allow'
        }
      ]
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

@suite('functional/elastic/configuration')
class TypexsSearchConfiguration {


  async before() {
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
  async 'check if framework handle was correctly selected'() {
    await beforeCall(testConfig[0]);
    const storage = Injector.get<Storage>(Storage.NAME);
    const storageFrameworks =  Object.keys(storage.storageFramework);
    expect(storageFrameworks).to.include(C_SEARCH_INDEX);

    const elasticRef = storage.get(C_ELASTIC_SEARCH);
    expect(elasticRef).to.be.instanceOf(ElasticStorageRef);

    const storageRef = Injector.get<ElasticStorageRef>('storage.elastic');
    expect(storageRef).to.be.instanceOf(ElasticStorageRef);
    expect(storageRef).to.eq(elasticRef);

    const opts = storageRef.getOptions();
    expect(opts).to.deep.eq({
      'entities': [],
      'framework': C_SEARCH_INDEX,
      'host': ES_host,
      'name': C_ELASTIC_SEARCH,
      'port': ES_port,
      'type': C_ELASTIC_SEARCH
    });
  }


  @test
  async 'check if default connection works'() {
    await beforeCall(testConfig[1]);
    const storageRef = Injector.get<ElasticStorageRef>('storage.elastic');
    expect(storageRef).to.be.instanceOf(ElasticStorageRef);
    const data = storageRef.getRawCollectionNames();
    expect(data).to.be.deep.eq(['core.test_entity']);
    const indicies = storageRef.getAliasNames();
    expect(indicies).to.be.deep.eq(['core']);
    const indexTypes = storageRef.getIndexTypes();
    expect(indexTypes.map(t => ({ aliasName: t.getAliasName(), typeName: t.getTypeName() }))).to.be.deep.eq([{
      aliasName: 'core',
      typeName: 'test_entity'
    }]);

    // create new index
    const checkIndex = await storageRef.checkIndices();
    expect(checkIndex).to.be.deep.eq({ core_xdx: true });
    expect(storageRef.isChecked()).to.be.true;
    storageRef.resetCheck();

    // no change index
    const checkIndex2 = await storageRef.checkIndices();
    expect(checkIndex2).to.be.deep.eq({ core_xdx: true });
    expect(storageRef.isChecked()).to.be.true;
    storageRef.resetCheck();

    // extend index
    process.env.ES_EXT_NEW = '1';
    const checkIndexAdd = await storageRef.checkIndices();
    expect(checkIndexAdd).to.be.deep.eq({ core_xdx: true });
    delete process.env.ES_EXT_NEW;
    expect(storageRef.isChecked()).to.be.true;
    storageRef.resetCheck();

    process.env.ES_EXT_UPDATE = '1';
    const checkIndexUpdate = await storageRef.checkIndices();
    expect(checkIndexUpdate).to.be.deep.eq({ core_xdx: true });
    delete process.env.ES_EXT_UPDATE;
    expect(storageRef.isChecked()).to.be.true;
    storageRef.resetCheck();
  }


  @test
  async 'check if dynamic index name creation works'() {
    await beforeCall(testConfig[2]);
    const storage = Injector.get<Storage>(Storage.NAME);
    const storageFrameworks =  Object.keys(storage.storageFramework);
    expect(storageFrameworks).to.include(C_SEARCH_INDEX);

    const elasticRef = storage.get(C_ELASTIC_SEARCH);
    expect(elasticRef).to.be.instanceOf(ElasticStorageRef);

    const storageRef = Injector.get<ElasticStorageRef>('storage.elastic');
    expect(storageRef).to.be.instanceOf(ElasticStorageRef);
    expect(storageRef).to.eq(elasticRef);
    const indicies = storageRef.getAliasNames();
    expect(indicies).to.be.deep.eq(['typeorm_default_test_entity']);
    const checkIndex2 = await storageRef.checkIndices();
    expect(checkIndex2).to.be.deep.eq({ typeorm_default_test_entity_xdx: true });
    expect(storageRef.isChecked()).to.be.true;
    storageRef.resetCheck();

  }


  @test
  async 'check if dynamic index name creation works - for schema entities'() {
    await beforeCall(testConfig[5]);
    const storage = Injector.get<Storage>(Storage.NAME);
    const storageFrameworks =  Object.keys(storage.storageFramework);
    expect(storageFrameworks).to.include(C_SEARCH_INDEX);

    const elasticRef = storage.get(C_ELASTIC_SEARCH);
    expect(elasticRef).to.be.instanceOf(ElasticStorageRef);

    const storageRef = Injector.get<ElasticStorageRef>('storage.elastic');
    expect(storageRef).to.be.instanceOf(ElasticStorageRef);
    expect(storageRef).to.eq(elasticRef);
    const indicies = storageRef.getAliasNames();
    expect(indicies).to.be.deep.eq(['built_entity_default_entity_by_schema_api']);
    const checkIndex2 = await storageRef.checkIndices();
    expect(checkIndex2).to.be.deep.eq({ built_entity_default_entity_by_schema_api_xdx: true });
    expect(storageRef.isChecked()).to.be.true;
    storageRef.resetCheck();

  }


  @test
  async 'check if pattern entity class matches'() {
    await beforeCall(testConfig[3]);

    const storageRef = Injector.get<ElasticStorageRef>('storage.elastic');
    expect(storageRef).to.be.instanceOf(ElasticStorageRef);


    expect(storageRef.hasEntityClass('*')).to.be.true;
    expect(storageRef.hasEntityClass('*Idx')).to.be.true;
    expect(storageRef.hasEntityClass('*_idx')).to.be.true;
    expect(storageRef.hasEntityClass('TestEn*')).to.be.true;
    expect(storageRef.hasEntityClass('TesterEntity')).to.be.false;
    expect(storageRef.hasEntityClass('TesterEntityIdx')).to.be.false;
    expect(storageRef.hasEntityClass('*Entity')).to.be.false;
    expect(storageRef.hasEntityClass('TestEntityIdx,RegistryEntityIdx')).to.be.true;
    expect(storageRef.hasEntityClass('Test*Idx,Registry*Idx')).to.be.true;
    expect(storageRef.hasEntityClass('TestT*Idx,RegistryP*Idx')).to.be.false;
    expect(storageRef.hasEntityClass('Test*Idx,RegistryP*Idx')).to.be.true;

    expect(storageRef.getEntityRef('*').map((x: any) => x.name)).to.be.deep.eq([
      'TestEntityIdx',
      'RegistryEntityIdx'
    ]);
    expect(storageRef.getEntityRef('*Idx').map((x: any) => x.name)).to.be.deep.eq([
      'TestEntityIdx',
      'RegistryEntityIdx'
    ]);
    expect(storageRef.getEntityRef('*_idx').map((x: any) => x.name)).to.be.deep.eq([
      'TestEntityIdx',
      'RegistryEntityIdx'
    ]);
    expect(storageRef.getEntityRef('TestEn*').name).to.be.deep.eq(
      'TestEntityIdx'
    );
    expect(storageRef.getEntityRef('TesterEntity')).to.be.null;
    expect(storageRef.getEntityRef('TesterEntityIdx')).to.be.null;
    expect(storageRef.getEntityRef('*Entity')).to.be.null;
    expect(storageRef.getEntityRef('TestEntityIdx,RegistryEntityIdx').map((x: any) => x.name)).to.be.deep.eq([
      'TestEntityIdx',
      'RegistryEntityIdx'
    ]);
    expect(storageRef.getEntityRef('Test*Idx,Registry*Idx').map((x: any) => x.name)).to.be.deep.eq([
      'TestEntityIdx',
      'RegistryEntityIdx'
    ]);
    expect(storageRef.getEntityRef('TestT*Idx,RegistryP*Idx')).to.be.null;
    expect(storageRef.getEntityRef('Test*Idx,RegistryP*Idx').name).to.be.eq('TestEntityIdx');

  }

  @test
  async 'check if worker is not active'() {
    await beforeCall(testConfig[3]);
    const status = Injector.get(IndexRuntimeStatus);
    expect(status.isWorkerActive()).to.be.false;
  }

  @test
  async 'check if worker is active'() {
    await beforeCall(testConfig[4]);
    const status = Injector.get(IndexRuntimeStatus);
    expect(status.isWorkerActive()).to.be.true;
  }

  /**
   * For building/passing the correct query/fields we need the field types of the mapping
   *
   * Test if filtering for types:
   * - date
   * - float
   * - boolean
   * - text
   * - long
   *
   * source for this detection is ElasticStorageRef.prepare method
   *
   * for primative types in our modell we must generate the correct mapping
   *
   *
   */
  @test.pending
  async 'TODO: check initialized fields for difference types output'() {
  }


}
