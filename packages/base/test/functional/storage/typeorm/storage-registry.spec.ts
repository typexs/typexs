import { suite, test } from '@testdeck/mocha';
import { TypeOrmEntityRegistry } from '../../../../src/libs/storage/framework/typeorm/schema/TypeOrmEntityRegistry';
import { Bootstrap, StorageRef } from '../../../../src';
import path from 'path';
import { Config } from '@allgemein/config';
import { TestHelper } from '@typexs/testing';
import { WithName } from './scenarios/class_annotations_schema_api/entities/WithName';
import { expect } from 'chai';

let registry: TypeOrmEntityRegistry = null;
let bootstrap: Bootstrap = null;
let storage: StorageRef = null;


@suite('functional/storage/typeorm/storage-registry')
class StorageRegistrySpec {
  /**
   * Start typexs with app dir scenarios/class_annotations and psql database configuration
   */
  static async before() {
    Bootstrap.reset();
    Config.clear();

    const appdir = path.join(__dirname, 'scenarios', 'class_annotations_schema_api');
    bootstrap = await Bootstrap.configure({
      app: { path: appdir },
      modules: {
        disableCache: true,
        paths: TestHelper.includePaths(),
        include: []
      },
      logging: {
        enable: false
      }
    }).prepareRuntime();
    bootstrap = await bootstrap.activateStorage();

    const storageManager = bootstrap.getStorage();
    storage = storageManager.get('default');
  }


  static async after() {
    if (bootstrap) {
      await bootstrap.shutdown();
    }

  }

  @test
  async 'check if entity is not double loaded'() {
    const cls = WithName;
    const ref1 = storage.getRegistry().getEntityRefFor(cls);
    const ref2 = storage.getRegistry().getEntityRefFor(cls);
    const ref3 = storage.getRegistry().getEntityRefFor('with_special_name');
    expect(ref1).to.be.eq(ref2);
    expect(ref1).to.be.eq(ref3);
  }

}
