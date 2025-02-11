import 'reflect-metadata';
import {expect} from 'chai';
import * as path from 'path';
import {suite, test} from '@testdeck/mocha';
import {Bootstrap} from '../../../src/Bootstrap';
import {Config} from '@allgemein/config';
import {C_DEFAULT} from '@allgemein/base';
import {SchemaUtils} from '@allgemein/schema-api';
import {Column, Entity, getMetadataArgsStorage, PrimaryGeneratedColumn} from 'typeorm';
import {TypeOrmConnectionWrapper} from '../../../src/libs/storage/framework/typeorm/TypeOrmConnectionWrapper';
import {EVENT_STORAGE_REF_PREPARED} from '../../../src/libs/storage/framework/typeorm/Constants';
import {TypeOrmStorageRef} from '../../../src/libs/storage/framework/typeorm/TypeOrmStorageRef';
import { TestHelper } from '@typexs/testing';

let bootstrap: Bootstrap;



@suite('functional/storage/add_entity_on_runtime (sqlite)')
class StorageAddEntityOnRuntimeSpec {


  async before() {
    // TestHelper.typeOrmReset();
    Bootstrap.reset();
    Config.clear();
    const appdir = path.join(__dirname, 'fake_app');
    bootstrap = Bootstrap
      .setConfigSources([{type: 'system'}])
      .configure({
        app: {
          path: appdir
        },
        modules: {
          paths: TestHelper.includePaths(),
          include: []
        },
        storage: {
          default: {
            synchronize: true,
            type: 'sqlite',
            database: ':memory:'
          } as any
        }
      });

    bootstrap.activateLogger();
    bootstrap.activateErrorHandling();
    await bootstrap.prepareRuntime();
    bootstrap = await bootstrap.activateStorage();
    bootstrap = await bootstrap.startup();
  }


  async after() {
    if (bootstrap) {
      await bootstrap.shutdown();
    }
  }


  @test
  async 'dynamically add entity'() {
    const metadataArgsStorage = getMetadataArgsStorage();
    const storageManager = bootstrap.getStorage();
    const storageRef = storageManager.get(C_DEFAULT) as TypeOrmStorageRef;

    let entityNames = storageRef.getEntityNames();
    entityNames.sort();
    expect(entityNames).to.be.deep.eq([
      'ModuleEntity',
      'SystemNodeInfo',
      'TestEntity'
    ]);

    const clazz = SchemaUtils.clazz('TestClass');

    let connection = await storageRef.connect() as TypeOrmConnectionWrapper;
    // open new connection

    Entity({name: 'test_class'})(clazz);
    PrimaryGeneratedColumn({type: 'int'})({constructor: clazz}, 'id');
    Column({type: 'varchar', length: 16})({constructor: clazz}, 'name');
    storageRef.addEntityClass(clazz);

    // now add new entity
    entityNames = storageRef.getEntityNames();
    expect(entityNames).to.have.length(4);
    entityNames.sort();
    expect(entityNames).to.be.deep.eq([
      'ModuleEntity',
      'SystemNodeInfo',
      'TestClass',
      'TestEntity'
    ]);

    let enttityMetadata = connection.connection.entityMetadatas;
    expect(enttityMetadata).to.have.length(3);

    // check if it can be queried
    let results = await connection.for('SystemNodeInfo').find();

    // check if old data is present (no in inmemory db)
    let error = null;
    try {
      results = await connection.for('TestClass').find();
    } catch (e) {
      error = e;
    }

    expect(error).to.not.be.null;

    await connection.close();
    connection = await storageRef.connect() as TypeOrmConnectionWrapper;

    enttityMetadata = connection._connection.entityMetadatas;
    expect(enttityMetadata).to.have.length(4);
    expect(enttityMetadata.map(x => x.name)).to.contain('TestClass');

    // check if it can be queried
    results = await connection.for('SystemNodeInfo').find();

    // check if old data is present (no in inmemory db)
    results = await connection.for('TestClass').find();


    await connection.close();
    expect(storageRef.listenerCount(EVENT_STORAGE_REF_PREPARED)).to.be.eq(0);
  }


  @test
  async 'dynamically add entity during opened connections'() {
    const storageManager = bootstrap.getStorage();
    const storageRef = storageManager.get(C_DEFAULT) as TypeOrmStorageRef;

    let entityNames = storageRef.getEntityNames();
    entityNames.sort();
    expect(entityNames).to.be.deep.eq([
      'ModuleEntity',
      'SystemNodeInfo',
      'TestEntity'
    ]);

    const clazz = SchemaUtils.clazz('TestClass');

    const connection = await storageRef.connect() as TypeOrmConnectionWrapper;
    // open new connection

    Entity({name: 'test_class'})(clazz);
    PrimaryGeneratedColumn({type: 'int'})({constructor: clazz}, 'id');
    Column({type: 'varchar', length: 16})({constructor: clazz}, 'name');
    storageRef.addEntityClass(clazz);

    // now add new entity
    entityNames = storageRef.getEntityNames();
    expect(entityNames).to.have.length(4);
    entityNames.sort();
    expect(entityNames).to.be.deep.eq([
      'ModuleEntity',
      'SystemNodeInfo',
      'TestClass',
      'TestEntity'
    ]);

    let enttityMetadata = connection.connection.entityMetadatas;
    expect(enttityMetadata).to.have.length(3);

    // check if it can be queried
    let results = await connection.for('SystemNodeInfo').find();

    // check if old data is present (no in inmemory db)
    let error = null;
    try {
      results = await connection.for('TestClass').find();
    } catch (e) {
      error = e;
    }

    expect(error).to.not.be.null;

    const connection2 = await storageRef.connect() as TypeOrmConnectionWrapper;

    enttityMetadata = connection2._connection.entityMetadatas;
    expect(enttityMetadata).to.have.length(4);
    expect(enttityMetadata.map(x => x.name)).to.contain('TestClass');

    // check if it can be queried
    results = await connection2.for('SystemNodeInfo').find();

    // check if old data is present (no in inmemory db)
    results = await connection2.for('TestClass').find();


    await Promise.all([connection.close(), connection2.close()]);
    expect(storageRef.listenerCount(EVENT_STORAGE_REF_PREPARED)).to.be.eq(0);
  }
}
