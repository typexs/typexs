import * as path from 'path';
import { suite, test } from '@testdeck/mocha';
import { expect } from 'chai';
import { Config } from '@allgemein/config';
import { RegistryFactory } from '@allgemein/schema-api';
import { Bootstrap, REGISTRY_TYPEORM, StorageRef } from '../../../../src';
import { TestHelper } from '@typexs/testing';
import { WithDateAsOrm } from './scenarios/class_annotations/entities/WithDateAsOrm';
import { postgres_host, postgres_port } from '../../config';


let bootstrap: Bootstrap = null;
let storage: StorageRef;
/**
 * Annotations by typeorm to @allgemein/schema-api
 */

@suite('functional/storage/typeorm/class_annotations - typeorm - psql')
class ClassAnnotationsTypeormPsqlSpec {


  static async before() {
    Bootstrap.reset();
    Config.clear();

    const appdir = path.join(__dirname, 'scenarios', 'class_annotations');
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
          host: postgres_host,
          port: postgres_port

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

