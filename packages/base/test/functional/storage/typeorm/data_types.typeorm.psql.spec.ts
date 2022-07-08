import * as path from 'path';
import { suite, test } from '@testdeck/mocha';
import { expect } from 'chai';
import { Config } from '@allgemein/config';
import { getMetadataArgsStorage } from 'typeorm';
import { RegistryFactory } from '@allgemein/schema-api';
import { Bootstrap, REGISTRY_TYPEORM, StorageRef } from '../../../../src';
import { WithNumbers } from './scenarios/app_types/entities/WithNumbers';
import { WithJson } from './scenarios/app_types/entities/WithJson';
import { WithDate } from './scenarios/app_types/entities/WithDate';
import { TestHelper } from '@typexs/testing';
import { WithDateAsOrm } from './scenarios/app_types/entities/WithDateAsOrm';


let bootstrap: Bootstrap = null;
let storage: StorageRef;
/**
 * Annotations by typeorm to @allgemein/schema-api
 */

@suite('functional/storage/typeorm/data_types - typeorm - psql')
class DataTypesTypeormPsqlSpec {


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



  @test
  async 'date'() {
    const registry = RegistryFactory.get(REGISTRY_TYPEORM);
    const entityRef = registry.getEntityRefFor(WithDateAsOrm);
    const properties = entityRef.getPropertyRefs();
    expect(properties).to.have.length(6);
    const pDateByType = properties.find(x => x.name === 'dateByType');
    expect(pDateByType.getType()).to.be.eq('date');
    const pDatetimeByType = properties.find(x => x.name === 'datetimeByType');
    expect(pDatetimeByType.getType()).to.be.eq('date');

  }

  static async after() {
    if (bootstrap) {
      await bootstrap.shutdown();
    }

  }


}

