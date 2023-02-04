import { suite, test, timeout } from '@testdeck/mocha';
import { expect } from 'chai';
import { Bootstrap, Config, Injector } from '@typexs/base';
import * as path from 'path';
import { ElasticStorageRef } from '../../src/lib/elastic/ElasticStorageRef';
import { ElasticConnection } from '../../src/lib/elastic/ElasticConnection';
import { IElasticStorageRefOptions } from '../../src/lib/elastic/IElasticStorageRefOptions';
import { ES_host, ES_port } from './config';
import { TestHelper } from './TestHelper';
import { C_ELASTIC_SEARCH, C_SEARCH_INDEX } from '../../src/lib/Constants';

let bootstrap: Bootstrap = null;
const appdir = path.join(__dirname, 'fake_app');
const resolve = TestHelper.root();
const testConfig = [
  {
    app: {
      path: appdir
    },
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
  }
];


@suite('functional/elastic/connection-error')
class TypexsSearchElasticConnectionError {

  @test.skip
  async ''() {

  }

}
