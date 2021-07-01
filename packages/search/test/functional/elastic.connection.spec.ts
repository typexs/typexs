import {suite, test, timeout} from '@testdeck/mocha';
import {expect} from 'chai';
import {Bootstrap, Config, Injector} from '@typexs/base';
import * as path from 'path';
import {ElasticStorageRef} from '../../src/lib/elastic/ElasticStorageRef';
import {ElasticConnection} from '../../src/lib/elastic/ElasticConnection';
import {IElasticStorageRefOptions} from '../../src/lib/elastic/IElasticStorageRefOptions';
import {ES_host, ES_port} from './config';

let bootstrap: Bootstrap = null;
const appdir = path.join(__dirname, 'fake_app');
const resolve = __dirname + '/../../../../..';
const testConfig = [
  {
    app: {path: appdir},
    modules: {paths: [resolve], disableCache: true},
    logging: {
      enable: false
    },
    storage: {
      elastic: <IElasticStorageRefOptions>{
        framework: 'index',
        type: 'elastic',
        host: ES_host,
        port: ES_port,

      }
    }
  },
];


@suite('functional/typexs-search/elastic/connection') @timeout(300000)
class TypexsSearchConnection {


  async before() {


    bootstrap = Bootstrap
      .setConfigSources([{type: 'system'}])
      .configure(testConfig.shift());

    bootstrap.activateErrorHandling();
    bootstrap.activateLogger();
    await bootstrap.prepareRuntime();
    await bootstrap.activateStorage();
    await bootstrap.startup();
  }

  async after() {
    if (bootstrap) {
      await bootstrap.shutdown();
      // await TestHelper.wait(500);
    }
    Bootstrap.reset();
  }


  @test
  async 'check if default connection works'() {
    const storageRef = Injector.get<ElasticStorageRef>('storage.elastic');
    expect(storageRef).to.be.instanceOf(ElasticStorageRef);
    const connection = await storageRef.connect() as ElasticConnection;

    const client = await connection.getClient();

    if ((await client.indices.exists({index: 'game-of-thrones'})).body) {
      await client.indices.delete({index: 'game-of-thrones', ignore_unavailable: true});
    }

    // client.
    const indexResult = await client.index({
      index: 'game-of-thrones',
      refresh: true,
      // type: '_doc', // uncomment this line if you are using {es} ≤ 6
      body: {
        character: 'Ned Stark',
        quote: 'Winter is coming.'
      }
    });

    // Let's search!
    const {body} = await client.search({
      index: 'game-of-thrones',
      // type: '_doc', // uncomment this line if you are using {es} ≤ 6
      body: {
        query: {
          match: {quote: 'winter'}
        }
      }
    });


    await connection.close();

    expect(indexResult.body).to.deep.include({
      _index: 'game-of-thrones',
      _type: '_doc',
      result: 'created',
      forced_refresh: true,
      _primary_term: 1
    });
    expect(body).to.be.not.empty;
    expect(body.hits).to.be.not.empty;
    expect(body.hits.total.value).to.be.eq(1);
    expect(body.hits.hits).to.be.have.length(1);
    expect(body.hits.hits[0]._type).to.be.eq('_doc');
    expect(body.hits.hits[0]._source).to.be.deep.include(
      {
        'character': 'Ned Stark',
        'quote': 'Winter is coming.'
      }
    );


    // await TestHelper.wait(100);

  }
}
