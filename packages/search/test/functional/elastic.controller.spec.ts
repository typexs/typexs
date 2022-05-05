import { suite, test } from '@testdeck/mocha';
import { Bootstrap, Injector, XS_P_$COUNT, XS_P_$LIMIT } from '@typexs/base';
import * as path from 'path';
import * as _ from 'lodash';
import { ElasticStorageRef } from '../../src/lib/elastic/ElasticStorageRef';
import { GreatEntity } from './fake_app_controller/entities/GreatEntity';
import { IndexEntityRef } from '../../src/lib/registry/IndexEntityRef';
import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { ElasticEntityController } from '../../src/lib/elastic/ElasticEntityController';
import { Client } from '@elastic/elasticsearch';
import { DataEntity } from './fake_app_controller/entities/DataEntity';
import { SearchEntity } from './fake_app_controller/entities/SearchEntity';
import {
  __ID__,
  __TYPE__,
  C_ELASTIC_SEARCH,
  C_SEARCH_INDEX,
  XS_P_$AGGREGATION,
  XS_P_$FACETS,
  XS_P_$INDEX,
  XS_P_$MAX_SCORE
} from '../../src/lib/Constants';
import { ClassUtils } from '@allgemein/base';
import { ES_host, ES_port } from './config';
import { TestHelper } from './TestHelper';
import { ElasticMappingUpdater } from '../../src/lib/elastic/mapping/ElasticMappingUpdater';
import { C_CORE_INDEX, C_DATA_INDEX, C_SEARCH_INDEX_2, clear } from './testdata';

use(chaiAsPromised);

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
    modules: {
      paths: [resolve],
      disableCache: true
    },
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
        connectOnStartup: true,
        host: ES_host,
        port: ES_port,
        indexTypes: [
          { index: 'core', entities: ['GreatEntity'] },
          { index: 'data_index', entities: ['DataEntity'] },
          { index: 'search_index', entities: ['SearchEntity'] }
          // { index: 'failing', entities: ['FailingEntity'] }
        ]
      }
    }
  }
];


let storageRef: ElasticStorageRef;
let controller: ElasticEntityController;
let client: Client;

@suite('functional/elastic/entity-controller')
class ElasticControllerSpec {


  static async before() {
    client = new Client({ node: 'http://' + ES_host + ':' + ES_port });
    const updater = new ElasticMappingUpdater(client);
    await client.ping();

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
    }
    await Promise.all(promises);

    await client.indices.refresh({ index: [C_DATA_INDEX, C_SEARCH_INDEX_2] });
  }

  static async after() {
    if (bootstrap) {
      await bootstrap.shutdown();
    }
    Bootstrap.reset();
    await client.close();
  }


  async before() {
    const { body } = await client.indices.exists({ index: C_CORE_INDEX });
    if (body) {
      await client.deleteByQuery({ index: C_CORE_INDEX, body: { query: { match_all: {} } } });
      await client.indices.refresh({ index: C_CORE_INDEX });
    }

  }


  @test
  async 'create and save new single entry'() {
    // const connection = await controller.connect();
    const entityRef = controller.forClass('GreatEntityIdx') as IndexEntityRef;
    const entityRefCheck = controller.forIndexType(GreatEntity) as IndexEntityRef;
    expect(entityRef).not.to.be.null;
    expect(entityRef).to.be.eq(entityRefCheck);

    // create entry
    const ge01 = new GreatEntity();
    ge01.id = 122;
    ge01.name = 'great entity 1';

    // const genId = entityRef.getTypeName() + '--' + ge01.id;
    const genId = '' + ge01.id;
    let saved = await controller.save(ge01, { passResults: true });

    let { body } = (await client.get({
      index: entityRef.getAliasName(),
      id: genId
    })) as any;

    let index = ge01['$index'];
    delete ge01['$index'];

    expect(body._id).to.be.eq(genId);
    expect(body._source).to.be.deep.include(saved);
    expect(index).to.be.deep.include({ _id: genId, _index: C_CORE_INDEX, result: 'created' });

    // Update data
    saved = await controller.save(ge01 as any, { passResults: true, refresh: true });
    expect(saved[XS_P_$INDEX]._version).to.be.eq(2);

    const resp = (await client.get({
      index: entityRef.getAliasName(),
      id: genId,
      refresh: true
    })) as any;

    body = resp.body;
    index = ge01['$index'];
    delete ge01['$index'];
    expect(body._id).to.be.eq(genId);
    expect(body._source).to.be.deep.include(saved);
    expect(index).to.be.deep.include({ _id: genId, _index: C_CORE_INDEX, result: 'updated' });
  }

  @test
  async 'create and save multiple entries'() {
    const entityRef = controller.forClass('GreatEntityIdx') as IndexEntityRef;

    // create entry
    const ge01 = new GreatEntity();
    ge01.id = 123;
    ge01.name = 'great entity it was';

    const ge02 = new GreatEntity();
    ge02.id = 121;
    ge02.name = 'great entity it was now';
    let g = [ge02, ge01];

    const saved = await controller.save(g, { passResults: true, refresh: true });
    const indexData = saved.map(x => {
      const a = x['$index'];
      delete x['$index'];
      return a;
    });
    const pResults = indexData.map(x => x.result);
    expect(pResults).to.have.length(2);
    expect(pResults).to.be.deep.eq(['created', 'created']);

    const results = (await client.search({
      index: entityRef.getAliasName(),
      body: {
        query: {
          match_all: {}
        }
      }
    })) as any;

    expect(results.body.hits.total.value).to.be.eq(2);
    expect(results.body.hits.hits).to.have.length(2);
    let sources = results.body.hits.hits.map((hit: any) => entityRef.build(hit._source, { skipClassNamespaceInfo: true }));
    sources = _.orderBy(sources, x => JSON.stringify(x));
    g = _.orderBy(g, x => JSON.stringify(x));
    expect(sources).to.be.deep.eq(g);
  }


  @test.skip()
  async 'retrieve existing entry'() {

  }

  @test
  async 'query/search for selected entity type (limited 10)'() {
    const queryResults = await controller.find('DataEntityIdx', null, { limit: 10, sort: { id: 'asc' } });
    expect(queryResults).to.have.length(10);
    // $max_score
    expect(queryResults[XS_P_$MAX_SCORE]).to.be.eq(null);
    expect(queryResults[XS_P_$COUNT]).to.be.eq(40);
    expect(queryResults[XS_P_$LIMIT]).to.be.eq(10);
  }

  @test
  async 'query/search for selected entity type with suffix (limited 10)'() {
    const queryResults = await controller.find('DataEntityIdx', null, { limit: 10, sort: { id: 'asc' } });
    expect(queryResults).to.have.length(10);
    // $max_score
    expect(queryResults[XS_P_$MAX_SCORE]).to.be.eq(null);
    expect(queryResults[XS_P_$COUNT]).to.be.eq(40);
    expect(queryResults[XS_P_$LIMIT]).to.be.eq(10);
    const classTypes = _.uniq(queryResults.map((x: any) => ClassUtils.getClassName(x))).sort();
    expect(classTypes).to.have.length(1);
    expect(classTypes).to.be.deep.eq(['DataEntity']);
  }

  @test
  async 'query/search for selected multiple entity types by entity refs (limited 10)'() {
    const entityRefs = [
      controller.forClass('DataEntityIdx') as IndexEntityRef,
      controller.forClass('SearchEntityIdx') as IndexEntityRef
    ];

    const queryResults = await controller.find(entityRefs, null, { limit: 10, sort: { id: 'asc' } });
    expect(queryResults).to.have.length(10);
    // $max_score
    expect(queryResults[XS_P_$MAX_SCORE]).to.be.eq(null);
    expect(queryResults[XS_P_$COUNT]).to.be.eq(80);
    expect(queryResults[XS_P_$LIMIT]).to.be.eq(10);
    const classTypes = _.uniq(queryResults.map((x: any) => ClassUtils.getClassName(x))).sort();
    expect(classTypes).to.have.length(2);
    expect(classTypes).to.be.deep.eq(['DataEntity', 'SearchEntity']);
  }

  @test
  async 'query/search for all entries (limited 10)'() {
    const queryResults = await controller.find('*', null, { limit: 10, sort: { id: 'asc' } });
    expect(queryResults).to.have.length(10);
    // $max_score
    expect(queryResults[XS_P_$MAX_SCORE]).to.be.eq(null);
    expect(queryResults[XS_P_$COUNT]).to.be.eq(80);
    expect(queryResults[XS_P_$LIMIT]).to.be.eq(10);
    const classTypes = _.uniq(queryResults.map((x: any) => ClassUtils.getClassName(x))).sort();
    expect(classTypes).to.have.length(2);
    expect(classTypes).to.be.deep.eq(['DataEntity', 'SearchEntity']);
  }

  @test
  async 'query/search for match entries (limited 10)'() {
    const queryResults = await controller.find('*', { _all: { $like: 'varius' } }, { limit: 10, sort: { id: 'asc' } });
    expect(queryResults).to.have.length(7);
    // $max_score
    expect(queryResults[XS_P_$MAX_SCORE]).to.be.eq(null);
    expect(queryResults[XS_P_$COUNT]).to.be.eq(7);
    expect(queryResults[XS_P_$LIMIT]).to.be.eq(10);
    const classTypes = _.uniq(queryResults.map((x: any) => ClassUtils.getClassName(x))).sort();
    expect(classTypes).to.have.length(2);
    expect(classTypes).to.be.deep.eq(['DataEntity', 'SearchEntity']);
  }


  @test
  async 'fail query/search for match entries'() {
    const queryResults = await controller.find('*', { _all: { $eq: 'lorum' } }, { limit: 10, sort: { id: 'asc' } });
    expect(queryResults).to.have.length(0);
    // $max_score
    expect(queryResults[XS_P_$MAX_SCORE]).to.be.eq(null);
    expect(queryResults[XS_P_$COUNT]).to.be.eq(0);
    expect(queryResults[XS_P_$LIMIT]).to.be.eq(10);
    // const classTypes = _.uniq(queryResults.map((x: any) => ClassUtils.getClassName(x))).sort();
    // expect(classTypes).to.have.length(2);
    // expect(classTypes).to.be.deep.eq(['DataEntity', 'SearchEntity']);
  }


  @test
  async 'query with highlight in object'() {
    const queryResults = await controller.find('*',
      { _all: { $like: 'takimata' } },
      {
        limit: 10,
        sort: { id: 'asc' },
        highlight: {}
      }
    );
    expect(queryResults).to.have.length(10);
    // $max_score
    expect(queryResults[XS_P_$MAX_SCORE]).to.be.eq(null);
    expect(queryResults[XS_P_$COUNT]).to.be.eq(80);
    expect(queryResults[XS_P_$LIMIT]).to.be.eq(10);
    const highlights = queryResults.map(x => x[XS_P_$INDEX].highlight).filter(x => !!x);
    expect(highlights).to.have.length(10);
  }


  @test
  async 'query with value facets'() {
    const queryResults = await controller.find('*',
      { _all: { $like: 'takimata' } },
      {
        limit: 10,
        sort: { id: 'asc' },
        facets: {
          enabled: [
            { type: 'value', name: 'enabled-entries' }
          ]
        }
      }
    );
    expect(queryResults).to.have.length(10);
    // $max_score
    expect(queryResults[XS_P_$MAX_SCORE]).to.be.eq(null);
    expect(queryResults[XS_P_$COUNT]).to.be.eq(80);
    expect(queryResults[XS_P_$LIMIT]).to.be.eq(10);
    expect(queryResults[XS_P_$FACETS]).to.have.length(1);
    expect(queryResults[XS_P_$FACETS][0]).to.deep.eq({
      'name': 'enabled-entries',
      'values': [
        {
          'doc_count': 40,
          'key': 0,
          'key_as_string': 'false'
        },
        {
          'doc_count': 40,
          'key': 1,
          'key_as_string': 'true'
        }
      ]
    });
  }


  @test
  async 'filter query with value facets'() {
    const queryResults = await controller.find('*',
      { $and: [{ _all: { $like: 'takimata' } }, { enabled: 'false' }] },
      {
        limit: 10,
        sort: { id: 'asc' },
        facets: {
          enabled: [
            { type: 'value', name: 'enabled-entries' }
          ]
        }
      }
    );
    expect(queryResults).to.have.length(10);
    // $max_score
    expect(queryResults[XS_P_$MAX_SCORE]).to.be.eq(null);
    expect(queryResults[XS_P_$COUNT]).to.be.eq(40);
    expect(queryResults[XS_P_$LIMIT]).to.be.eq(10);
    expect(queryResults[XS_P_$FACETS]).to.have.length(1);
    expect(queryResults[XS_P_$FACETS][0]).to.deep.eq({
      'name': 'enabled-entries',
      'values': [{
        'doc_count': 40,
        'key': 0,
        'key_as_string': 'false'
      }]
    });
  }

  @test
  async 'query with passed aggs'() {
    const queryResults = await controller.find('*',
      { $and: [{ _all: { $like: 'takimata' } }] },
      {
        limit: 10,
        sort: { id: 'asc' },
        aggs: {
          'enabled-entries': { terms: { field: 'enabled' } }

        }
      }
    );
    expect(queryResults).to.have.length(10);
    // $max_score
    expect(queryResults[XS_P_$MAX_SCORE]).to.be.eq(null);
    expect(queryResults[XS_P_$COUNT]).to.be.eq(80);
    expect(queryResults[XS_P_$LIMIT]).to.be.eq(10);
    expect(_.keys(queryResults[XS_P_$AGGREGATION])).to.have.length(1);
    expect(_.keys(queryResults[XS_P_$AGGREGATION])).to.be.deep.eq(['enabled-entries']);
    expect(queryResults[XS_P_$AGGREGATION]).to.deep.eq({
      'enabled-entries': {
        'buckets': [
          {
            'doc_count': 40,
            'key': 0,
            'key_as_string': 'false'
          },
          {
            'doc_count': 40,
            'key': 1,
            'key_as_string': 'true'
          }
        ],
        'doc_count_error_upper_bound': 0,
        'sum_other_doc_count': 0
      }
    });
  }


  @test
  async 'aggregate of entries by find op'() {
    const queryResults = await controller.find('*', null,
      {
        limit: 10,
        sort: { id: 'asc' },
        aggs: {
          'enabled-entries':
            {
              terms:
                {
                  field: 'enabled'
                }
            }
        },
        // disable query
        onEmptyConditions: 'skip'
      });
    // $max_score
    expect(queryResults[XS_P_$MAX_SCORE]).to.be.eq(null);
    expect(queryResults).to.have.length(0);
    expect(queryResults[XS_P_$COUNT]).to.be.eq(80);
    expect(queryResults[XS_P_$LIMIT]).to.be.eq(10);
    expect(_.keys(queryResults[XS_P_$AGGREGATION])).to.have.length(1);
    expect(_.keys(queryResults[XS_P_$AGGREGATION])).to.be.deep.eq(['enabled-entries']);
    expect(queryResults[XS_P_$AGGREGATION]).to.deep.eq({
      'enabled-entries': {
        'buckets': [
          {
            'doc_count': 40,
            'key': 0,
            'key_as_string': 'false'
          },
          {
            'doc_count': 40,
            'key': 1,
            'key_as_string': 'true'
          }
        ],
        'doc_count_error_upper_bound': 0,
        'sum_other_doc_count': 0
      }
    });
  }

  @test.skip()
  async 'update existing entry'() {
  }

  @test.skip()
  async 'update entries by condition'() {
  }


  @test
  async 'delete existing entry'() {
    const queryResults = await controller.find('*',
      { _all: { $like: 'carusus' } },
      {
        limit: 10,
        sort: { id: 'asc' }
      }
    );

    expect(queryResults).to.have.length(2);

    const deleted = await controller.remove(queryResults);
    expect(deleted).to.eq(2);

    const checkQueryResults = await controller.find('*',
      { _all: { $like: 'carusus' } },
      {
        limit: 10,
        sort: { id: 'asc' }
      }
    );

    expect(checkQueryResults).to.have.length(0);
    expect(checkQueryResults[XS_P_$COUNT]).to.be.eq(0);
  }


  @test
  async 'delete entries by condition'() {
    const queryResults = await controller.find(DataEntity,
      { _all: { $like: 'harsut' } },
      {
        limit: 10
      }
    );

    expect(queryResults).to.have.length(3);

    const deleted = await controller.remove(DataEntity, { _all: { $like: 'harsut' } }, { refresh: true });
    expect(deleted).to.eq(3);

    const checkQueryResults = await controller.find(DataEntity,
      { _all: { $like: 'harsut' } },
      {
        limit: 10,
        sort: { id: 'asc' }
      }
    );

    expect(checkQueryResults).to.have.length(0);
    expect(checkQueryResults[XS_P_$COUNT]).to.be.eq(0);
  }


  @test
  async 'throw errors - cause query error'() {
    const termQuery = { multi_match: {} };
    termQuery.multi_match = {
      query: 'harsut',
      'operator': 'and',
      'minimum_should_match': 1,
      'analyzer': 'standard',
      'zero_terms_query': 'none',
      'lenient': false,
      'prefix_length': 0,
      'max_expansions': 50,
      'boost': 1,
      fields: ['someNumber']
    };

    let error = null;
    try {
      await controller.find(DataEntity,
        termQuery,
        {
          rawQuery: true,
          limit: 10
        }
      );
    } catch (e) {
      error = e;
    }

    expect(error.name).to.be.eq('ResponseError');
    expect(error.message).to.be.eq(
      'search_phase_execution_exception: [query_shard_exception] Reason: failed to create query: For input string: "harsut"'
    );
  }

  @test
  async 'throw errors from shares - cause query error'() {
    const termQuery = { multi_match: {} };
    termQuery.multi_match = {
      query: 'harsut',
      'operator': 'and',
      'minimum_should_match': 1,
      'analyzer': 'standard',
      'zero_terms_query': 'none',
      'lenient': false,
      'prefix_length': 0,
      'max_expansions': 50,
      'boost': 1,
      fields: ['someNumber']
    };

    let error = null;
    try {
      await controller.find('*',
        termQuery,
        {
          rawQuery: true,
          limit: 10
        }
      );
    } catch (e) {
      error = e;
    }

    expect(error.name).to.be.eq('StorageError');
    expect(error.message).to.be.eq(
      '[number_format_exception] error on index "data_index_xdx" failed to create query: For input string: "harsut"'
    );
  }

}
