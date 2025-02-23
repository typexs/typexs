import * as fs from 'fs';
import * as path from 'path';

import { suite, test } from '@testdeck/mocha';
import { expect } from 'chai';
import { Invoker } from '../../../../src/base/Invoker';
import { IStorageRefOptions } from '../../../../src/libs/storage/IStorageRefOptions';
import { Bootstrap } from '../../../../src/Bootstrap';
import { Config } from '@allgemein/config';
import { BeforeInsert, Column, PrimaryColumn } from 'typeorm';
import { X1 } from './../entities/X1';
import { Y1 } from './../entities/Y1';
import { TEST_STORAGE_OPTIONS } from '../../config';
import { ClassRef } from '@allgemein/schema-api';
import { TypeOrmStorageRef } from '../../../../src/libs/storage/framework/typeorm/TypeOrmStorageRef';
import { BaseConnectionOptions } from 'typeorm/connection/BaseConnectionOptions';
import { C_DEFAULT } from '@allgemein/base';
import { Injector } from '../../../../src/libs/di/Injector';
import { TestHelper } from '@typexs/testing';
import { clone, cloneDeep, map, merge } from '@typexs/generic';


let bootstrap: Bootstrap;
let storageOptions: IStorageRefOptions & BaseConnectionOptions = null;

@suite('functional/storage/typeorm/general')
class StorageGeneralSpec {


  before() {
    Bootstrap.reset();
    Config.clear();
    storageOptions = cloneDeep(TEST_STORAGE_OPTIONS) as IStorageRefOptions & BaseConnectionOptions;
  }


  async after() {
    if (bootstrap) {
      await bootstrap.shutdown();
    }
  }


  @test
  async 'storage options override'() {
    const opt1: IStorageRefOptions & BaseConnectionOptions = {
      name: 'default',
      type: 'sqlite',
      entityPrefix: 'test',
      connectOnStartup: true
    };
    const opt2: IStorageRefOptions & BaseConnectionOptions = {
      name: 'default2', type: 'postgres', connectOnStartup: true
    };
    const options: IStorageRefOptions = merge(opt1, opt2);
    expect(options).to.be.deep.eq({
      name: 'default2', type: 'postgres',
      entityPrefix: 'test', connectOnStartup: true
    });
  }


  @test
  async 'storage bootstrap'() {
    const appdir = path.join(__dirname, '../fake_app');
    bootstrap = await Bootstrap.configure({
      app: {
        path: appdir
      },
      modules: {
        paths: TestHelper.includePaths(),
        include: []
      }
    }).prepareRuntime();
    bootstrap = await bootstrap.activateStorage();

    const storageManager = bootstrap.getStorage();
    const storage: TypeOrmStorageRef = storageManager.get();

    expect(storage['options']).to.deep.include({
      name: 'default',
      type: 'sqlite',
      database: ':memory:'
    });

    const entityNames = [];
    for (const fn of storage['options']['entities']) {
      entityNames.push((<Function>fn).prototype.constructor.name);
    }
    expect(entityNames.sort()).to.be.deep.eq([
      'SystemNodeInfo',
      'ModuleEntity',
      'TestEntity'
    ].sort());

    let storageRef: TypeOrmStorageRef = storageManager.forClass('module_entity');
    expect(storageRef.name).to.eq(C_DEFAULT);

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const TestEntity = require('./../fake_app/entities/TestEntity').TestEntity;
    const classRef = ClassRef.get(TestEntity, 'dummy');
    storageRef = storageManager.forClass(classRef);
    expect(storageRef.name).to.eq(C_DEFAULT);


    const classRef2 = storageRef.getClassRef('TestEntity');
    expect(classRef2.getClass()).to.be.eq(TestEntity);
    const classRef3 = storageRef.getClassRef('test_entity');
    expect(classRef2.getClass()).to.be.eq(TestEntity);
    expect(classRef2).to.be.eq(classRef3);
    expect(classRef2.storingName).to.be.eq('test_entity');
    expect(classRef2.name).to.be.eq('TestEntity');

    const entityRef_1 = storageRef.getEntityRef('test_entity');
    const entityRef_2 = storageRef.getEntityRef('TestEntity');
    const entityRef_3 = storageRef.getEntityRef(TestEntity);
    expect(entityRef_1.name).to.be.eq('TestEntity');
    expect(entityRef_2.name).to.be.eq('TestEntity');
    expect(entityRef_3.name).to.be.eq('TestEntity');

    const properties = entityRef_1.getPropertyRefs();
    expect(properties).to.have.length(2);
    expect(map(properties, p => p.name)).to.deep.eq(['id', 'name']);


  }


  @test
  async 'dynamically add entity class to memory db'() {

    class X {
      @PrimaryColumn()
      id: number;
    }

    const invoker = new Invoker();
    Injector.set(Invoker.NAME, invoker);

    const storage = new TypeOrmStorageRef(storageOptions as IStorageRefOptions & BaseConnectionOptions);
    await storage.prepare();

    storage.addTableEntityClass(X, 'xtable');
    await storage.reload();
    expect(storage['options'].entities).has.length(1);

    const c = await storage.connect();
    // WHERE type='table'
    const q = await c.query('SELECT * FROM sqlite_master WHERE type = \'table\' ;');
    expect(q).has.length(1);
  }


  @test
  async 'dynamically add entity class to file db '() {

    class X {
      @PrimaryColumn()
      id: number;
    }

    const dbfile = path.join(__dirname, '/tmp/testdb01.sqlite');
    const opts = merge(clone(storageOptions), { database: dbfile });


    const invoker = new Invoker();
    Injector.set(Invoker.NAME, invoker);

    const storage = new TypeOrmStorageRef(opts as any);
    await storage.prepare();

    storage.addTableEntityClass(X, 'xtable');
    await storage.reload();
    expect(storage.getDeclaredEntities()).has.length(1);

    const c = await storage.connect();
    const q = await c.query('SELECT * FROM sqlite_master WHERE type=\'table\';');
    expect(q).has.length(1);

    if (fs.existsSync(dbfile)) {
      fs.unlinkSync(dbfile);
    }
    await storage.shutdown(true);
  }

  @test
  async 'typeorm detect listener on dynamically added class'() {
    class X {
      @PrimaryColumn()
      id: number;

      @Column()
      txt: string;

      test = false;

      @BeforeInsert()
      t() {
        this.test = true;
      }
    }

    class Y extends X {
      test2 = false;

      @BeforeInsert()
      tes() {
        this.test2 = true;
      }
    }

    const invoker = new Invoker();
    Injector.set(Invoker.NAME, invoker);

    const storage = new TypeOrmStorageRef(storageOptions as any);
    await storage.prepare();

    storage.addTableEntityClass(X, 'xtable');
    storage.addTableEntityClass(Y, 'ytable');
    await storage.reload();

    const c = await storage.connect();
    const repo = c.for<X>('xtable');
    let x = new X();
    x.id = 1;
    x.txt = 'txt';
    x = await repo.save(x);
    expect(x.test).to.be.true;

    const repo2 = c.for<Y>('ytable');
    let y = new Y();
    y.id = 1;
    y.txt = 'txt';
    y = await repo2.save(y);
    expect(y.test).to.be.true;
    expect(y.test2).to.be.true;
    await storage.shutdown(true);
  }


  @test
  async 'typeorm detect listener on fixed added class'() {
    const opts = merge(clone(storageOptions), { entities: [X1, Y1] });

    const invoker = new Invoker();
    Injector.set(Invoker.NAME, invoker);

    const storage = new TypeOrmStorageRef(opts as any);
    await storage.prepare();

    const c = await storage.connect();
    const repo = c.for(X1);
    let x = new X1();
    x.id = 1;
    x.txt = 'txt';
    x = await repo.save(x);
    expect(x.test).to.be.true;

    const repo2 = c.for(Y1);
    let y = new Y1();
    y.id = 1;
    y.txt = 'txt';
    y = await repo2.save(y);
    expect(y.test).to.be.true;
    expect(y.test2).to.be.true;
    await storage.shutdown(true);
  }
}

