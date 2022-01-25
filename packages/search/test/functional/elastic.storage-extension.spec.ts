import { expect } from 'chai';
import * as _ from 'lodash';
import { suite, test, timeout } from '@testdeck/mocha';
import { Bootstrap, C_STORAGE_DEFAULT, Injector } from '@typexs/base';
import * as path from 'path';
import { ElasticStorageRef } from '../../src/lib/elastic/ElasticStorageRef';
import { ElasticEntityController } from '../../src/lib/elastic/ElasticEntityController';
import { Client } from '@elastic/elasticsearch';
import { DataEntity } from './fake_app_controller/entities/DataEntity';
import { SearchEntity } from './fake_app_controller/entities/SearchEntity';
import { ES_host, ES_port } from './config';
import { IndexProcessingWorker } from '../../src/workers/IndexProcessingWorker';
import { TestHelper } from './TestHelper';
import { C_ELASTIC_SEARCH, C_SEARCH_INDEX } from '../../src/lib/Constants';
import { IElasticStorageRefOptions } from '../../src';
import { clear } from './testdata';
import { ElasticMappingUpdater } from '../../src/lib/elastic/mapping/ElasticMappingUpdater';

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
      elastic: <IElasticStorageRefOptions>{
        framework: C_SEARCH_INDEX,
        type: C_ELASTIC_SEARCH,
        connectOnStartup: true,
        host: ES_host,
        port: ES_port,
        indexTypes: [
          { index: 'data_index', entities: ['DataEntity'] },
          { index: 'search_index', entities: ['SearchEntity'] }
        ]
      }
    },
    workers: {
      access: [
        { name: IndexProcessingWorker.name, access: 'allow' }
      ]
    }
  }
];


let storageRef: ElasticStorageRef;
let controller: ElasticEntityController;
let client: Client;

@suite('functional/elastic/storage-extension') @timeout(300000)
class ElasticStorageExtensionSpec {


  static async before() {
    client = new Client({ node: 'http://' + ES_host + ':' + ES_port });
    await client.ping();
    const updater = new ElasticMappingUpdater(client);
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


  }

  static async after() {
    if (bootstrap) {
      await bootstrap.shutdown();
    }
    Bootstrap.reset();
    await client.close();
  }


  async before() {

  }


  @test
  async 'index entity after save by default storage'() {
    const words = lorem.split(' ');
    const words2 = lorem2.split(' ');

    const indexProcessingWorker = Injector.get<IndexProcessingWorker>(IndexProcessingWorker);
    const dbStorageRef = Injector.get<ElasticStorageRef>(C_STORAGE_DEFAULT);
    const dbController = dbStorageRef.getController();
    const inc = indexProcessingWorker.queue.queue.getInc();
    const i = 1;
    const entity = new DataEntity();
    entity.id = i;
    entity.date = new Date(2020, i % 12, i % 30);
    entity.name = words[i];
    entity.text = words.slice(i).join(' ');
    entity.someNumber = i * 123;
    entity.enabled = i % 2 === 0;
    const savedEntity = await dbController.save(entity);
    expect(savedEntity['$state']).to.not.be.null;
    delete entity['$state'];

    await TestHelper.waitFor(() => indexProcessingWorker.queue.queue.getInc() > inc);
    await indexProcessingWorker.queue.await();
    await indexProcessingWorker.queue.refresh();

    const indexedSavedEntity = await storageRef.getController().find('DataEntityIdx', { id: { $eq: 1 } });
    expect(indexedSavedEntity).to.have.length(1);
    expect(indexedSavedEntity[0]).to.be.deep.include(entity);
  }

  @test
  async 'index entities after save by default storage'() {
    const words = lorem.split(' ');
    const words2 = lorem2.split(' ');
    const indexProcessingWorker = Injector.get<IndexProcessingWorker>(IndexProcessingWorker);
    const dbStorageRef = Injector.get<ElasticStorageRef>(C_STORAGE_DEFAULT);
    const dbController = dbStorageRef.getController();

    const inc = indexProcessingWorker.queue.queue.getInc();
    const entities = [];
    for (const i of _.range(5, 15)) {
      const d = new DataEntity();
      d.id = i;
      d.date = new Date(2020, i % 12, i % 30);
      d.name = words[i];
      d.text = words.slice(i).join(' ');
      d.someNumber = i * 123;
      d.enabled = i % 2 === 0;
      entities.push(d);
    }

    const savedEntities = await dbController.save(entities);
    expect(savedEntities).to.have.length(10);
    await TestHelper.waitFor(() =>
      indexProcessingWorker.queue.queue.getInc() >= inc + 10
    );
    await indexProcessingWorker.queue.await();
    // await TestHelper.wait(10000);
    // await indexDispatcher.LOCK.await();

    const indexedSavedEntity = await storageRef.getController()
      .find('DataEntityIdx', { $and: [{ id: { $ge: 5 } }, { id: { $le: 15 } }] }, { sort: { id: 'asc' } });
    expect(indexedSavedEntity).to.have.length(10);
    for (let i = 0; i < entities.length; i++) {
      const e = entities[i];
      const idx = entities[i];
      delete e['$state'];
      expect(idx).to.be.deep.include(e);
    }
  }


  @test
  async 'delete a indexed entity after removed from default storage'() {
    const words = lorem.split(' ');
    const words2 = lorem2.split(' ');
    const indexProcessingWorker = Injector.get<IndexProcessingWorker>(IndexProcessingWorker);
    const dbStorageRef = Injector.get<ElasticStorageRef>('storage.default');
    const dbController = dbStorageRef.getController();
    const inc = indexProcessingWorker.queue.queue.getInc();
    const i = 100;
    const entity = new DataEntity();
    entity.id = i;
    entity.date = new Date(2020, i % 12, i % 30);
    entity.name = words[i];
    entity.text = words.slice(i).join(' ');
    entity.someNumber = i * 123;
    entity.enabled = i % 2 === 0;
    const savedEntity = await dbController.save(entity);
    expect(savedEntity['$state']).to.not.be.null;
    delete entity['$state'];
    await TestHelper.waitFor(() =>
      indexProcessingWorker.queue.queue.getInc() >= inc + 1
    );

    await indexProcessingWorker.queue.await();

    let indexedSavedEntity = await storageRef.getController().find('DataEntityIdx', { id: { $eq: 100 } });
    expect(indexedSavedEntity).to.have.length(1);
    expect(indexedSavedEntity[0]).to.be.deep.include(entity);

    const removeCount = await dbController.remove(entity);
    expect(removeCount).to.be.eq(1);
    await indexProcessingWorker.queue.await();

    indexedSavedEntity = await storageRef.getController().find('DataEntityIdx', { id: { $eq: 100 } });
    expect(indexedSavedEntity).to.have.length(0);
  }


  @test
  async 'delete by condition a indexed entity after removed from default storage'() {
    const words = lorem.split(' ');
    const words2 = lorem2.split(' ');
    const indexProcessingWorker = Injector.get<IndexProcessingWorker>(IndexProcessingWorker);
    const dbStorageRef = Injector.get<ElasticStorageRef>(C_STORAGE_DEFAULT);
    const dbController = dbStorageRef.getController();
    const inc = indexProcessingWorker.queue.queue.getInc();
    const entities = [];
    for (const i of _.range(50, 65)) {
      const d = new DataEntity();
      d.id = i;
      d.date = new Date(2020, i % 12, i % 30);
      d.name = words[i];
      d.text = words.slice(i).join(' ');
      d.someNumber = i * 123;
      d.enabled = i % 2 === 0;
      entities.push(d);
    }

    const savedEntities = await dbController.save(entities);
    expect(savedEntities).to.have.length(15);
    await TestHelper.waitFor(() =>
      indexProcessingWorker.queue.queue.getInc() >= inc + 15
    );
    await indexProcessingWorker.queue.await();

    let indexedSavedEntities = await storageRef.getController()
      .find('DataEntityIdx', { $and: [{ id: { $ge: 50 } }, { id: { $le: 65 } }] }, { sort: { id: 'asc' } });
    expect(indexedSavedEntities).to.have.length(15);


    const removeCount = await dbController.remove(DataEntity, { $and: [{ id: { $ge: 50 } }, { id: { $le: 65 } }] });
    expect(removeCount).to.be.eq(-2);
    await indexProcessingWorker.queue.await();

    indexedSavedEntities = await storageRef.getController()
      .find('DataEntityIdx', { $and: [{ id: { $ge: 50 } }, { id: { $le: 65 } }] });
    expect(indexedSavedEntities).to.have.length(0);
  }

}
