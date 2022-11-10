import * as path from 'path';
import { suite, test } from '@testdeck/mocha';
import { expect } from 'chai';
import { Config } from '@allgemein/config';
import { getMetadataArgsStorage } from 'typeorm';
import { Bootstrap, StorageRef } from '../../../../src';
import { WithNumbers } from './scenarios/class_annotations_schema_api/entities/WithNumbers';
import { WithJson } from './scenarios/class_annotations_schema_api/entities/WithJson';
import { WithDate } from './scenarios/class_annotations_schema_api/entities/WithDate';
import { TestHelper } from '@typexs/testing';
import { postgres_host, postgres_port } from '../../config';
import { WithName } from './scenarios/class_annotations_schema_api/entities/WithName';
import { OnlyClass } from './scenarios/class_annotations_schema_api/entities/OnlyClass';
import { WithTableName } from './scenarios/class_annotations_schema_api/entities/WithTableName';
import { WithNameAndTableName } from './scenarios/class_annotations_schema_api/entities/WithNameAndTableName';
import { WithTableNameSame } from './scenarios/class_annotations_schema_api/entities/WithTableNameSame';


let bootstrap: Bootstrap = null;
let storage: StorageRef;


/**
 * Testing entity annotations with schema-api
 *
 *
 */
@suite('functional/storage/typeorm/class_annotations - schema-api - psql')
class ClassAnnotationsSchemaApiPsqlSpec {

  /**
   * Start typexs with app dir scenarios/class_annotations_schema_api and psql database configuration
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


  /**
   * Let typeorm handle table name creation
   */
  @test
  async 'check if class name is passed as table name'() {
    const cls = OnlyClass;
    const metaStore = getMetadataArgsStorage();
    const ref = storage.getRegistry().getEntityRefFor(cls);
    const table = metaStore.filterTables(cls).shift();
    expect(table.name).to.be.undefined;
    expect(table.target).to.be.eq(cls);
    expect(ref.name).to.be.eq('OnlyClass');
    expect(ref.machineName).to.be.eq('only_class');
    expect(ref.storingName).to.be.eq('only_class');
    expect(ref.getClass()).to.be.eq(cls);
    expect(ref.getClassRef().name).to.be.eq('OnlyClass');

    const t = await storage.getRawCollectionNames();
    expect(t).to.contain('only_class');
  }

  /**
   * Table name should be overwritten by name
   */
  @test
  async 'check override of table name with given name'() {
    const cls = WithName;
    const metaStore = getMetadataArgsStorage();
    const ref = storage.getEntityRef(cls);
    const table = metaStore.filterTables(cls).shift();
    expect(table.name).to.be.eq('with_special_name');
    expect(table.target).to.be.eq(cls);
    expect(ref.name).to.be.eq('with_special_name');
    expect(ref.machineName).to.be.eq('with_special_name');
    expect(ref.storingName).to.be.eq('with_special_name');
    expect(ref.getClass()).to.be.eq(cls);
    expect(ref.getClassRef().name).to.be.eq('WithName');

    const t = await storage.getRawCollectionNames();
    expect(t).to.contain('with_special_name');
  }

  /**
   * Table name should be overwritten by internal name
   */
  @test
  async 'check override of table name with given internal name'() {
    const cls = WithTableName;
    const metaStore = getMetadataArgsStorage();
    const ref = storage.getRegistry().getEntityRefFor(cls);
    const table = metaStore.filterTables(cls).shift();
    expect(table.name).to.be.eq('with_special_table_name');
    expect(table.target).to.be.eq(cls);
    expect(ref.name).to.be.eq('WithTableName');
    expect(ref.machineName).to.be.eq('with_table_name');
    expect(ref.storingName).to.be.eq('with_special_table_name');
    expect(ref.getClass()).to.be.eq(cls);
    expect(ref.getClassRef().name).to.be.eq('WithTableName');

    const t = await storage.getRawCollectionNames();
    expect(t).to.contain('with_special_table_name');
  }


  /**
   * Table name should be overwritten by internal name and name should be passed
   */
  @test
  async 'check override of table name with given internal name and name'() {
    const cls = WithNameAndTableName;
    const metaStore = getMetadataArgsStorage();
    const ref = storage.getRegistry().getEntityRefFor(cls);
    const table = metaStore.filterTables(cls).shift();
    expect(table.name).to.be.eq('with_extra_special_table_name');
    expect(table.target).to.be.eq(cls);
    expect(ref.name).to.be.eq('with_name_extra');
    expect(ref.machineName).to.be.eq('with_name_extra');
    expect(ref.storingName).to.be.eq('with_extra_special_table_name');
    expect(ref.getClass()).to.be.eq(cls);
    expect(ref.getClassRef().name).to.be.eq('WithNameAndTableName');

    const t = await storage.getRawCollectionNames();
    expect(t).to.contain('with_extra_special_table_name');
  }

  /**
   * Table name should be overwritten by internal name and name should be passed
   */
  @test
  async 'check multiple classes for same table'() {
    const cls1 = WithTableName;
    const cls2 = WithTableNameSame;
    const metaStore = getMetadataArgsStorage();
    const ref1 = storage.getRegistry().getEntityRefFor(cls1);
    const ref2 = storage.getRegistry().getEntityRefFor(cls2);
    const table1 = metaStore.filterTables(cls1).shift();
    const table2 = metaStore.filterTables(cls2).shift();
    expect(table1.name).to.be.eq('with_special_table_name');
    expect(table1.target).to.be.eq(cls1);
    expect(table2.name).to.be.eq('with_special_table_name');
    expect(table2.target).to.be.eq(cls2);
    expect(ref1.name).to.be.eq('WithTableName');
    expect(ref2.name).to.be.eq('WithTableNameSame');
    expect(ref1.machineName).to.be.eq('with_table_name');
    expect(ref2.machineName).to.be.eq('with_table_name_same');
    expect(ref1.storingName).to.be.eq('with_special_table_name');
    expect(ref2.storingName).to.be.eq('with_special_table_name');
    expect(ref1.getClass()).to.be.eq(cls1);
    expect(ref2.getClass()).to.be.eq(cls2);
    expect(ref1.getClassRef().name).to.be.eq('WithTableName');
    expect(ref2.getClassRef().name).to.be.eq('WithTableNameSame');

    const t = await storage.getRawCollectionNames();
    expect(t).to.contain('with_special_table_name');
  }

  @test
  async 'field of type bigint'() {
    const metaStore = getMetadataArgsStorage();
    const columns = metaStore.filterColumns(WithNumbers);
    expect(columns).to.have.length(3);
    expect(columns.map(x => x.options.type)).to.be.deep.eq(['int', 'bigint', 'bigint']);

  }

  @test
  async 'field of type json'() {
    const metaStore = getMetadataArgsStorage();
    const columns = metaStore.filterColumns(WithJson);
    expect(columns).to.have.length(5);
    expect(columns.map(x => x.options.type)).to.be.deep.eq(['int', 'jsonb', 'jsonb', 'jsonb', 'jsonb']);
  }


  @test
  async 'field of type date'() {
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

