import * as path from 'path';
import { suite, test } from '@testdeck/mocha';
import { expect } from 'chai';
import { Config } from '@allgemein/config';
import { getMetadataArgsStorage } from 'typeorm';
import { Bootstrap, StorageRef } from '../../../../src';
import { ClassRef } from '@allgemein/schema-api';


let bootstrap: Bootstrap = null;
let storage: StorageRef;

@suite('functional/storage/storage_ref_data_types - psql')
class StorageRefDataTypesPsqlSpec {


  static async before() {
    Bootstrap.reset();
    Config.clear();

    const appdir = path.join(__dirname, 'scenarios', 'app_types');
    bootstrap = await Bootstrap.configure({
      app: { path: appdir },
      modules: {
        disableCache: true,
        paths: [__dirname + '/../../../..'],
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


  @test
  async 'bigint'() {
    const metaStore = getMetadataArgsStorage();
    const columns = metaStore.filterColumns(ClassRef.get('WithNumbers').getClass());
    expect(columns).to.have.length(3);
    expect(columns.map(x => x.options.type)).to.be.deep.eq(['int', 'bigint', 'bigint']);

  }

  @test
  async 'json'() {
    const metaStore = getMetadataArgsStorage();
    const columns = metaStore.filterColumns(ClassRef.get('WithJson').getClass());
    expect(columns).to.have.length(5);
    expect(columns.map(x => x.options.type)).to.be.deep.eq(['int', 'jsonb', 'jsonb', 'jsonb', 'jsonb']);

  }

  @test
  async 'date'() {
    const metaStore = getMetadataArgsStorage();
    const columns = metaStore.filterColumns(ClassRef.get('WithDate').getClass());
    expect(columns).to.have.length(5);
    expect(columns.map(x => x.options.type)).to.be.deep.eq(['int', 'date', 'date', Date, Date]);

  }

  static async after() {
    if (bootstrap) {
      await bootstrap.shutdown();
    }

  }


}

