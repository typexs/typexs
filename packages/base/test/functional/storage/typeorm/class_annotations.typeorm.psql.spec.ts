import * as path from 'path';
import { suite, test } from '@testdeck/mocha';
import { expect } from 'chai';
import { Config } from '@allgemein/config';
import { RegistryFactory } from '@allgemein/schema-api';
import { Bootstrap, REGISTRY_TYPEORM, StorageRef } from '../../../../src';
import { TestHelper } from '@typexs/testing';
import { postgres_host, postgres_port } from '../../config';
import { WithDateOrm } from './scenarios/class_annotations_typeorm/entities/WithDateOrm';
import { OnlyClassOrm } from './scenarios/class_annotations_typeorm/entities/OnlyClassOrm';
import { getMetadataArgsStorage } from 'typeorm';
import { WithNameOrm } from './scenarios/class_annotations_typeorm/entities/WithNameOrm';
import { WithNumbersOrm } from './scenarios/class_annotations_typeorm/entities/WithNumbersOrm';
import { WithJsonOrm } from './scenarios/class_annotations_typeorm/entities/WithJsonOrm';


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

    const appdir = path.join(__dirname, 'scenarios', 'class_annotations_typeorm');
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
        }
      }
    }).prepareRuntime();
    bootstrap = await bootstrap.activateStorage();

    const storageManager = bootstrap.getStorage();
    storage = storageManager.get('default');
  }

  /**
   * Let typeorm handle table name creation
   */
  @test
  async 'check if class name is passed as table name'() {
    const cls = OnlyClassOrm;
    const metaStore = getMetadataArgsStorage();
    const ref = storage.getRegistry().getEntityRefFor(cls);
    const table = metaStore.filterTables(cls).shift();
    expect(table.name).to.be.undefined;
    expect(table.target).to.be.eq(cls);
    expect(ref.name).to.be.eq('OnlyClassOrm');
    expect(ref.machineName).to.be.eq('only_class_orm');
    expect(ref.storingName).to.be.eq('only_class_orm');
    expect(ref.getClass()).to.be.eq(cls);
    expect(ref.getClassRef().name).to.be.eq('OnlyClassOrm');

    const t = await storage.getRawCollectionNames();
    expect(t).to.contain('only_class_orm');
  }

  /**
   * Table name should be overwritten by name
   */
  @test
  async 'check override of table name with given name'() {
    const cls = WithNameOrm;
    const metaStore = getMetadataArgsStorage();
    const ref = storage.getEntityRef(cls);
    const table = metaStore.filterTables(cls).shift();
    expect(table.name).to.be.eq('with_special_name');
    expect(table.target).to.be.eq(cls);
    expect(ref.name).to.be.eq('WithNameOrm');
    expect(ref.machineName).to.be.eq('with_name_orm');
    expect(ref.storingName).to.be.eq('with_special_name');
    expect(ref.getClass()).to.be.eq(cls);
    expect(ref.getClassRef().name).to.be.eq('WithNameOrm');

    const t = await storage.getRawCollectionNames();
    expect(t).to.contain('with_special_name');
  }


  @test
  async 'field of type bigint'() {
    const metaStore = getMetadataArgsStorage();
    const columns = metaStore.filterColumns(WithNumbersOrm);
    expect(columns).to.have.length(2);
    expect(columns.map(x => x.options.type)).to.be.deep.eq(['int', 'bigint']);

  }

  @test
  async 'field of type json'() {
    const metaStore = getMetadataArgsStorage();
    const columns = metaStore.filterColumns(WithJsonOrm);
    expect(columns).to.have.length(4);
    expect(columns.map(x => x.options.type)).to.be.deep.eq(['int', 'jsonb', 'jsonb', 'jsonb']);
  }


  @test
  async 'field of type date'() {
    const metaStore = getMetadataArgsStorage();
    const columns = metaStore.filterColumns(WithDateOrm);
    expect(columns).to.have.length(6);
    expect(columns.map(x => x.options.type)).to.be.deep.eq(['int', 'date', 'date', 'timestamp with time zone', undefined, undefined]);
    expect(columns.map(x => x.mode)).to.be.deep.eq(['regular', 'regular', 'regular', 'regular', 'createDate', 'updateDate']);
  }


  @test
  async 'date'() {
    const registry = RegistryFactory.get(REGISTRY_TYPEORM);
    const entityRef = registry.getEntityRefFor(WithDateOrm);
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

