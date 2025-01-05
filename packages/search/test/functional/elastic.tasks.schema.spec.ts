import { last, range } from '@typexs/generic';


import { suite, test, timeout } from '@testdeck/mocha';
import { Bootstrap, Counters, IEntityController, Injector } from '@typexs/base';
import * as path from 'path';
import { ElasticStorageRef } from '../../src/lib/elastic/ElasticStorageRef';
import { ElasticEntityController } from '../../src/lib/elastic/ElasticEntityController';
import { Client } from '@elastic/elasticsearch';
import { ES_host, ES_port } from './config';
import { TaskExecutor } from '@typexs/tasks';
import { __ID__, __TYPE__, C_ELASTIC_SEARCH, C_SEARCH_INDEX, TN_INDEX } from '../../src/lib/Constants';
import { ITaskRunnerResult } from '@typexs/tasks';
import { IndexProcessingQueue } from '../../src/lib/IndexProcessingQueue';
import { expect } from 'chai';
import { IndexProcessingWorker } from '../../src/workers/IndexProcessingWorker';
import { TestHelper } from './TestHelper';
import { IElasticStorageRefOptions } from '../../src/lib/elastic/IElasticStorageRefOptions';


let bootstrap: Bootstrap = null;
const appdir = path.join(__dirname, 'scenarios', 'app_with_schema_entities');
const resolve = TestHelper.root();
const testConfig = [
  {
    app: { path: appdir },
    modules: { paths: [resolve], disableCache: true },
    logging: {
      enable: false,
      level: 'debug',
      loggers: [{
        name: '*',
        enable: false,
        level: 'debug',
        transports: [{ console: {} }]
      }]
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
          { index: 'car_index', entities: ['Car'] }
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

@suite('functional/typexs-search/elastic/tasks-schema') @timeout(300000)
class TypexsSearchEntityController {


  static async before() {
    // const words = lorem.split(' ');
    // const words2 = lorem2.split(' ');

    client = new Client({ node: 'http://' + ES_host + ':' + ES_port });
    await client.ping();

    const existsData = await client.indices.exists({ index: 'car_index_xdx' });
    if (existsData.body) {
      await client.indices.delete({ index: 'car_index_xdx' });
    }
    // delete index
    const { body } = await client.indices.exists({ index: 'core_xdx' });
    if (body) {
      await client.indices.delete({ index: 'core_xdx' });
    }


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

    const dbController = Injector.get<IEntityController>('EntityController.default');

    const Car = require('./scenarios/app_with_schema_entities/entities/Car').Car;
    const Driver = require('./scenarios/app_with_schema_entities/entities/Driver').Driver;

    const entities = [];
    for (const i of range(60, 90)) {
      const idxReset = i - 60;
      const d = new Car();
      d[__ID__] = i + '';
      d[__TYPE__] = 'car';
      d.id = i;
      d.producer = 'dasds ' + i;
      d.driver = new Driver();
      d.driver.age = i + 18;
      d.driver.nickName = 'name ' + i;

      entities.push(d);
    }
    const worker = await Injector.get<IndexProcessingWorker>(IndexProcessingWorker);
    const inc = worker.queue.queue.getInc();
    await dbController.save(entities, <any>{ refresh: true });
    try {
      await worker.queue.await();
      await TestHelper.waitFor(() =>
        worker.queue.queue.getInc() >= inc + 30
      );
      await TestHelper.wait(1000);
    } catch (e) {

    }

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
  async 'reindex all entities'() {
    // const indexProcessingWorker =  Injector.get(indexProcessingWorker);
    // const inc = indexProcessingWorker.queue.queue.getInc();
    const executor = Injector.create(TaskExecutor);
    const data = await executor.create(
      [TN_INDEX],
      {},
      {
        isLocal: true,
        skipTargetCheck: true
      })
      .run() as ITaskRunnerResult;


    expect(data.tasks).to.have.length(1);
    const res = last(data.results);
    expect((<Counters>res['counters']).asObject()).to.deep.eq({
      'class': {
        'Car': 30
      },
      'deleted': {
        'Car': 30
      },
      'index': 30
    });


    const { body } = await client.search({ index: ['car_index'], body: { query: { match_all: {} } }, size: 0 });
    expect(body.hits.total.value).to.be.eq(30);
  }

  @test
  async 'reindex only Car entities'() {
    const executor = Injector.create(TaskExecutor);
    const data = await executor.create(
      [TN_INDEX],
      {
        entityNames: 'Car'
      },
      {
        isLocal: true,
        skipTargetCheck: true
      })
      .run() as ITaskRunnerResult;
    // console.log(inspect(data, false, 10));
    await Injector.get(IndexProcessingQueue).await();
    expect(data.tasks).to.have.length(1);
    const res = last(data.results);
    expect((<Counters>res['counters']).asObject()).to.deep.eq({
      'class': {
        'Car': 30
      },
      'deleted': {
        'Car': 30
      },
      'index': 30
    });


    const { body } = await client.search({ index: ['car_index'], body: { query: { match_all: {} } }, size: 0 });
    expect(body.hits.total.value).to.be.eq(30);
  }

}
