import * as path from 'path';
import { map } from '@typexs/generic';


import { suite, test } from '@testdeck/mocha';
import { expect } from 'chai';

import { Bootstrap } from '../../../src/Bootstrap';
import { Config } from '@allgemein/config';
import { TypeOrmStorageRef } from '../../../src/libs/storage/framework/typeorm/TypeOrmStorageRef';
import { TestHelper } from '@typexs/testing';


@suite('functional/storage/schema_handler')
class GeneralSpec {


  before() {
    Bootstrap.reset();
    Config.clear();
  }

  @test.skip()
  async 'loading schema handler adapters'() {

  }

  @test
  async 'storage bootstrap'() {
    const appdir = path.join(__dirname, 'fake_app_handler');
    let bootstrap = await Bootstrap
      .configure({
        app: {
          path: appdir
        },
        modules: {
          paths: TestHelper.includePaths()
        }
      })
      .prepareRuntime();

    bootstrap = await bootstrap.activateStorage();

    const storageManager = bootstrap.getStorage();
    const storageRef: TypeOrmStorageRef = storageManager.get();


    const c = await storageRef.connect();
    let q = await c.query('CREATE TABLE "hiddentable" ("id" integer PRIMARY KEY NOT NULL, "name" varchar NOT NULL)');
    q = await c.query('SELECT name FROM sqlite_master WHERE type=\'table\';');

    const schemaHandler = storageRef.getSchemaHandler();
    const tableNames = await schemaHandler.getCollectionNames();
    expect(tableNames).to.have.length(5);
    expect(tableNames).to.have.members(map(q, _q => _q.name));

    const tables = await schemaHandler.getCollections(tableNames);
    expect(tables).to.have.length(5);
    expect(tableNames).to.have.members(map(tables, _q => _q.name));

    await bootstrap.shutdown();
    await bootstrap.getStorage().shutdown();
  }


}

