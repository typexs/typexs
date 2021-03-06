import * as path from 'path';
import { suite, test } from '@testdeck/mocha';
import { expect } from 'chai';
import { Config } from '@allgemein/config';
import { getMetadataArgsStorage } from 'typeorm';
import { Bootstrap, StorageRef } from '../../../../src';
import { WithNumbers } from './scenarios/app_types/entities/WithNumbers';
import { WithJson } from './scenarios/app_types/entities/WithJson';
import { WithDate } from './scenarios/app_types/entities/WithDate';
import { TestHelper } from '@typexs/testing';


let bootstrap: Bootstrap = null;
let storage: StorageRef;

@suite('functional/storage/typeorm/data_types - schema-api - psql')
class DataTypesSchemaApiPsqlSpec {


  static async before() {
    Bootstrap.reset();
    Config.clear();

    const appdir = path.join(__dirname, 'scenarios', 'app_types');
    bootstrap = await Bootstrap.configure({
      app: { path: appdir },
      modules: {
        disableCache: true,
        paths: TestHelper.includePaths(),
        include: []
      },
      logging: {
        enable: false
      },
      storage: {
        default: <any>{
          synchronize: true,
          type: 'postgres',
          database: 'txsbase',
          username: 'txsbase',
          password: '',
          host: '127.0.0.1',
          port: 5436
          // logging: 'all',
          // logger: 'simple-console'
        }
      }
    }).prepareRuntime();
    bootstrap = await bootstrap.activateStorage();

    const storageManager = bootstrap.getStorage();
    storage = storageManager.get('default');
  }


  /**
   * Annotations by @allgemein/schema-api to typeorm
   */

  @test
  async 'bigint'() {
    const metaStore = getMetadataArgsStorage();
    const columns = metaStore.filterColumns(WithNumbers);
    expect(columns).to.have.length(3);
    expect(columns.map(x => x.options.type)).to.be.deep.eq(['int', 'bigint', 'bigint']);

  }

  @test
  async 'json'() {
    const metaStore = getMetadataArgsStorage();
    const columns = metaStore.filterColumns(WithJson);
    expect(columns).to.have.length(5);
    expect(columns.map(x => x.options.type)).to.be.deep.eq(['int', 'jsonb', 'jsonb', 'jsonb', 'jsonb']);
  }


  @test
  async 'date'() {
    const metaStore = getMetadataArgsStorage();
    const columns = metaStore.filterColumns(WithDate);
    expect(columns).to.have.length(5);
    expect(columns.map(x => x.options.type)).to.be.deep.eq(['int', 'date', 'date', Date, Date]);
  }


  static async after() {
    if (bootstrap) {
      await bootstrap.shutdown();
    }

  }


}

