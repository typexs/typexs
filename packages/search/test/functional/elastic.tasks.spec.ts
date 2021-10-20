import * as _ from 'lodash';
import {suite, test, timeout} from '@testdeck/mocha';
import {Bootstrap, Counters, Injector, StorageRef} from '@typexs/base';
import * as path from 'path';
import {ElasticStorageRef} from '../../src/lib/elastic/ElasticStorageRef';
import {ElasticEntityController} from '../../src/lib/elastic/ElasticEntityController';
import {Client} from '@elastic/elasticsearch';
import {ES_host, ES_port} from './config';
import {lorem, lorem2} from './testdata';
import {TaskExecutor} from '@typexs/base/libs/tasks/TaskExecutor';
import { __ID__, __TYPE__, C_ELASTIC_SEARCH, C_SEARCH_INDEX, TN_INDEX } from '../../src/lib/Constants';
import {ITaskRunnerResult} from '@typexs/base/libs/tasks/ITaskRunnerResult';
import {SomeSearchEntity} from './fake_app_tasks/entities/SomeSearchEntity';
import {SearchDataEntity} from './fake_app_tasks/entities/SearchDataEntity';
import {IndexProcessingQueue} from '../../src/lib/events/IndexProcessingQueue';
import {expect} from 'chai';
import {IndexProcessingWorker} from '../../src/workers/IndexProcessingWorker';
import { TestHelper } from './TestHelper';
import { IElasticStorageRefOptions } from '../../src';


let bootstrap: Bootstrap = null;
const appdir = path.join(__dirname, 'fake_app_tasks');
const resolve = TestHelper.root();
const testConfig = [
  {
    app: {path: appdir},
    modules: {paths: [resolve], disableCache: true},
    logging: {
      enable: false,
      level: 'debug',
      loggers: [{
        name: '*',
        level: 'debug',
        transports: [{console: {}}]
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
          {index: 'data_index', entities: ['SearchDataEntity']},
          {index: 'search_index', entities: ['SomeSearchEntity']}
        ]
      }
    },
    workers: {
      access: [
        {name: IndexProcessingWorker.name, access: 'allow'}
      ]
    }
  },
];


let storageRef: ElasticStorageRef;
let controller: ElasticEntityController;
let client: Client;

@suite('functional/typexs-search/elastic/tasks') @timeout(300000)
class TypexsSearchEntityController {


  static async before() {
    const words = lorem.split(' ');
    const words2 = lorem2.split(' ');

    client = new Client({node: 'http://' + ES_host + ':' + ES_port});
    await client.ping();


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

    const dbStorageRef = Injector.get<StorageRef>('storage.default');
    const dbController = dbStorageRef.getController();

    const entities = [];
    for (const i of _.range(60, 90)) {
      const idxReset = i - 60;
      const d = new SearchDataEntity();
      d[__ID__] = i + '';
      d[__TYPE__] = 'search_data_entity';
      d.id = i;
      d.date = new Date(2020, i % 12, i % 30);
      d.name = words[idxReset];
      d.text = words.slice(idxReset).join(' ');
      d.someNumber = i * 123;
      d.enabled = i % 2 === 0;
      if (d.enabled) {
        d.name = words2[idxReset];
        d.text = words2.slice(idxReset).join(' ');
      }
      entities.push(d);
      // promises.push(client.index({
      //   index: 'data_index',
      //   id: d['__type'] + '--' + d['__id'],
      //   body: d
      // }));


      const s = new SomeSearchEntity();
      s[__ID__] = i + '';
      s[__TYPE__] = 'some_search_entity';
      s.id = i;
      s.datus = new Date(2020, i % 12, i % 30);
      s.search = words[idxReset + 1];
      s.textus = words.slice(idxReset + 1).join(' ');
      s.numerus = i * 43;
      s.enabled = i % 2 === 1;
      if (s.enabled) {
        s.search = words2[idxReset + 1];
        s.textus = words2.slice(idxReset + 1).join(' ');
      }
      // promises.push(client.index({
      //   index: 'search_index',
      //   id: s['__type'] + '--' + s['__id'],
      //   body: s
      // }));

      entities.push(s);

    }
    const worker = await Injector.get<IndexProcessingWorker>(IndexProcessingWorker);
    const inc = worker.queue.queue.getInc();
    // await Promise.all(promises);
    // await client.indices.refresh({index: ['data_index', 'search_index']});
    await dbController.save(entities, <any>{refresh: true});
    try {

      await worker.queue.await();
      await TestHelper.waitFor(() =>
        worker.queue.queue.getInc() >= inc + 60
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
    // console.log(inspect(data, false, 10));
    // await Injector.get(IndexProcessingQueue).await();


    expect(data.tasks).to.have.length(1);
    const res = _.last(data.results);
    expect((<Counters>res['counters']).asObject()).to.deep.eq({
      'class': {
        'SearchDataEntity': 30,
        'SomeSearchEntity': 30
      },
      'deleted': {
        'SearchDataEntity': 30,
        'SomeSearchEntity': 30
      },
      'index': 60
    });


    const {body} = await client.search({index: ['data_index', 'search_index'], body: {query: {match_all: {}}}, size: 0});
    expect(body.hits.total.value).to.be.eq(60);
  }

  @test
  async 'reindex only SomeSearchEntity entities'() {
    const executor = Injector.create(TaskExecutor);
    const data = await executor.create(
      [TN_INDEX],
      {
        entityNames: 'SomeSearchEntity'
      },
      {
        isLocal: true,
        skipTargetCheck: true,
      })
      .run() as ITaskRunnerResult;
    // console.log(inspect(data, false, 10));
    await Injector.get(IndexProcessingQueue).await();
    expect(data.tasks).to.have.length(1);
    const res = _.last(data.results);
    expect((<Counters>res['counters']).asObject()).to.deep.eq({
      'class': {
        'SomeSearchEntity': 30
      },
      'deleted': {
        'SomeSearchEntity': 30
      },
      'index': 30
    });


    const {body} = await client.search({index: ['search_index'], body: {query: {match_all: {}}}, size: 0});
    expect(body.hits.total.value).to.be.eq(30);
  }

}
