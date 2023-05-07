// process.env.SQL_LOG = '1';
import { expect } from 'chai';
import '../../src/libs/decorators/register';
import { suite, test } from '@testdeck/mocha';
import { TestHelper } from './TestHelper';
import { StorageRef, TypeOrmConnectionWrapper } from '@typexs/base';
import { RegistryFactory } from '@allgemein/schema-api';
import { EntityRegistry } from '../../src/libs/EntityRegistry';
import { NAMESPACE_BUILT_ENTITY } from '../../src/libs/Constants';
import { TEST_STORAGE_OPTIONS } from './config';
import { clone, set } from 'lodash';
import { EntityController } from '../../src';
import { inspect } from 'util';

let inc = 0;

const FINDOPT = {
  hooks: {
    abortCondition: (entityRef: any, propertyDef: any, results: any, op: any) => op.entityDepth > 1
  }
};


let registry: EntityRegistry;
let IntegratedObject = null;
let EntityWithIntegrated = null;
let EntityWithIntegratedArray = null;

let entityController: EntityController;
let storageRef: StorageRef;
let connection: TypeOrmConnectionWrapper;

/**
 * Testing property where properties values are save directly in the created property table
 *
 * - p_xxxx_yyy
 *   * id
 *   * zzz of xxx
 */
@suite('functional/sql_e-po_indirect_referencing')
class SqlE_PoIndirectReferencingSpec {


  static async before() {
    // TypeOrmEntityRegistry.reset();
    // TestHelper.resetTypeorm();

    registry = RegistryFactory.get(NAMESPACE_BUILT_ENTITY);
    IntegratedObject = require('./sceanrio/e-po-dynamic/IntegratedObject').IntegratedObject;
    EntityWithIntegrated = require('./sceanrio/e-po-dynamic/EntityWithIntegrated').EntityWithIntegrated;
    EntityWithIntegratedArray = require('./sceanrio/e-po-dynamic/EntityWithIntegratedArray').EntityWithIntegratedArray;

    registry.getEntityRefFor(EntityWithIntegrated);
    registry.getEntityRefFor(EntityWithIntegratedArray);


    const options = clone(TEST_STORAGE_OPTIONS);
    set(options, 'name', 'e-po-dynamic');
    // set(options, 'logger', 'simple-console');
    // set(options, 'logging', 'all');
    const connect = await TestHelper.connect(options);
    entityController = connect.controller;
    storageRef = connect.ref;
    connection = await storageRef.connect() as TypeOrmConnectionWrapper;
  }

  static async after() {
    RegistryFactory.reset();
    if (connection) {
      await connection.close();
    }
    if (storageRef) {
      await storageRef.shutdown();
    }
  }

  before() {
  }

  after() {

  }

  /**
   * Check that tables für Entity and Embeddable where created and the relation table between
   */
  @test
  async 'generated schema'() {
    const collectionNames = await storageRef.getRawCollectionNames();
    expect(collectionNames).to.be.include.members([
      'entity_with_integrated',
      'p_entity_with_integrated_object',
      'entity_with_integrated_array',
      'p_entity_with_integrated_array_object'
    ]);

    const collections = await storageRef.getRawCollections([
      'entity_with_integrated',
      'p_entity_with_integrated_object',
      'entity_with_integrated_array',
      'p_entity_with_integrated_array_object'
    ]);

    expect(collections.find(x => x.name === 'entity_with_integrated').properties.map(x => x.name)).to.be.deep.eq([
      'id',
      'nr'
    ]);
    expect(collections.find(x => x.name === 'p_entity_with_integrated_object').properties.map(x => x.name)).to.be.deep.eq([
      'id',
      'source_type',
      'source_id',
      'source_seq_nr',
      'value'
    ]);
    expect(collections.find(x => x.name === 'entity_with_integrated_array').properties.map(x => x.name)).to.be.deep.eq([
      'id',
      'nr'
    ]);
    expect(collections.find(x => x.name === 'p_entity_with_integrated_array_object').properties.map(x => x.name)).to.be.deep.eq([
      'id',
      'source_type',
      'source_id',
      'source_seq_nr',
      'value'
    ]);
  }

  @test.skip
  async 'find entity with object (one-to-one) - empty '() {
  }


  @test
  async 'find entity with object (one-to-one) - with element'() {
    // create scenario
    const nr = inc++;
    await connection.query('insert into entity_with_integrated (`nr`) values (' + nr + ');');
    const raw = await connection.query('select max(id) as maxId from entity_with_integrated;');
    const entityId = raw.shift().maxId;
    await connection.query(
      'insert into p_entity_with_integrated_object ' +
      '(`source_type`,`source_id`,`source_seq_nr`,`value`) values ' +
      '("entity_with_integrated",' + entityId + ',0,"test");');
    // raw = await connection.query('select max(id) as maxId from p_entity_with_object_object;');

    const entry = await entityController.find('EntityWithIntegrated', { id: entityId });
    // console.log(inspect(entry, false, 10));
    expect(entry).to.have.length(1);
    expect(entry.shift()).to.be.deep.eq({
      id: entityId,
      nr: nr,
      object: { value: 'test' }
    });
  }


  @test
  async 'find entity with object array (one-to-many) - empty'() {
    // create scenario
    const nr = inc++;
    await connection.query('insert into entity_with_integrated_array (`nr`) values (' + nr + ');');
    const raw = await connection.query('select max(id) as maxId from entity_with_integrated_array;');
    const entityId = raw.shift().maxId;
    // await connection.query(
    //   'insert into p_entity_with_integrated_array_object ' +
    //   '(`source_type`,`source_id`,`source_seq_nr`,`value`) values ' +
    //   '("entity_with_integrated",' + entityId + ',0,"test");');
    // raw = await connection.query('select max(id) as maxId from p_entity_with_object_object;');


    const entry = await entityController.find('EntityWithIntegratedArray', { id: entityId });
    // console.log(inspect(entry, false, 10));
    expect(entry).to.have.length(1);
    expect(entry.shift()).to.be.deep.eq({
      id: entityId,
      nr: nr,
      object: []
    });
  }

  @test
  async 'find entity with object array (one-to-many) - one entry'() {
    // create scenario
    const nr = inc++;
    await connection.query('insert into entity_with_integrated_array (`nr`) values (' + nr + ');');
    // await connection.query('insert into integrated_object (`value`) values ( \'test-' + nr + '\');');
    const raw = await connection.query('select max(id) as maxId from entity_with_integrated_array;');
    const entityId = raw.shift().maxId;
    await connection.query(
      'insert into p_entity_with_integrated_array_object ' +
      '(`source_type`,`source_id`,`source_seq_nr`,`value`) values ' +
      '("entity_with_integrated_array",' + entityId + ',0,"test");');
    // raw = await connection.query('select max(id) as maxId from p_entity_with_integrated_array_object;');


    const entry = await entityController.find('EntityWithIntegratedArray', { id: entityId });
    // console.log(inspect(entry, false, 10));
    expect(entry).to.have.length(1);
    expect(entry.shift()).to.be.deep.eq({
      id: entityId,
      nr: nr,
      object: [{ value: 'test' }]
    });
  }

  @test.skip
  async 'find entity with object array (many-to-one)'() {

  }

  @test.skip
  async 'find entity with object array (many-to-many)'() {

  }

  @test
  async 'save entity with object (one-to-one)'() {
    const clazz = registry.getEntityRefFor('EntityWithIntegrated');
    const entity = clazz.getClassRef().build({
      nr: 5,
      object: { value: 'save-test-1' }
    }, { skipClassNamespaceInfo: true });

    const entry = await entityController.save(entity);

    const entityObject = (await connection.query(
      'select * from entity_with_integrated where id = (select max(id) as maxId from entity_with_integrated);')).shift();
    const object = (await connection.query(
      'select * from p_entity_with_integrated_object where id >= (select max(id) as maxId from p_entity_with_integrated_object) - 1;'));

    expect(entityObject).to.be.deep.eq({
      id: entityObject.id,
      nr: 5
    });
    const foundRel = object.filter((x: any) => x.source_id === entityObject.id);
    expect(foundRel).to.be.deep.eq([{
      'id': foundRel[0].id,
      'source_type': 'entity_with_integrated',
      'source_id': entityObject.id,
      'source_seq_nr': 0,
      'value': 'save-test-1'
    }]);

    /**
     * Check if resave makes problems
     */
    const found = await entityController.findOne(clazz.getClass(), { id: entityObject.id });
    delete entry['$state'];
    expect(found).to.deep.eq(entry);

    const resave = await entityController.save(found);
    console.log(inspect(resave, false, 10));
    delete resave['$state'];
    expect(found).to.deep.eq(resave);

  }

  @test.skip
  async 'save entity with object array'() {

  }

  @test.skip
  async 'update entity with object'() {

  }

  @test.skip
  async 'update entity with object array'() {

  }

  // @test
  // async 'entity lifecycle for integrated property'() {
  //   const options = _.clone(TEST_STORAGE_OPTIONS);
  //   //    (<any>options).name = 'direct_property';
  //
  //
  //   const Author = require('./schemas/default/Author').Author;
  //   const Book = require('./schemas/default/Book').Book;
  //   const Summary = require('./schemas/default/Summary').Summary;
  //
  //   registry.reload([Author, Book, Summary]);
  //
  //   const connect = await TestHelper.connect(options);
  //   const xsem = connect.controller;
  //   const ref = connect.ref;
  //   const c = await ref.connect() as TypeOrmConnectionWrapper;
  //
  //
  //   const a = new Author();
  //   a.firstName = 'Bert';
  //   a.lastName = 'Waia';
  //
  //   let book_save_1 = new Book();
  //   book_save_1.content = 'This is a good book';
  //   book_save_1.author = a;
  //
  //   const summary = new Summary();
  //   summary.size = 1000;
  //   summary.content = 'This is a good summary';
  //   book_save_1.summary = summary;
  //
  //   book_save_1 = await xsem.save(book_save_1, {validate: false});
  //
  //   // console.log(book_save_1)
  //
  //   // let data2 = await c.connection.query('SELECT name FROM sqlite_master WHERE type=\'table\';');
  //   // expect(data2).to.have.length(5);
  //
  //   let data = await c.connection.query('select * from author');
  //   expect(data).to.have.length(1);
  //   expect(data[0].id).to.eq(1);
  //
  //   data = await c.connection.query('select * from book');
  //   expect(data).to.have.length(1);
  //   expect(data[0].id).to.eq(1);
  //
  //   data = await c.connection.query('select * from p_book_author');
  //   expect(data).to.have.length(1);
  //   expect(data[0].source_id).to.eq(1);
  //   expect(data[0].target_id).to.eq(1);
  //   expect(data[0].source_seq_nr).to.eq(0);
  //
  //   data = await c.connection.query('select * from p_summary');
  //   expect(data).to.have.length(1);
  //   expect(data[0].source_id).to.eq(1);
  //   expect(data[0].source_seq_nr).to.eq(0);
  //
  //
  //   const books_found = await xsem.find(Book, {id: 1}, FINDOPT);
  //   expect(books_found).to.have.length(1);
  //   const book_find_1 = books_found.shift();
  //   // console.log(book_find_1);
  //   expect((book_find_1 as any).summary.size).to.be.eq(summary.size);
  //   expect(book_save_1).to.deep.eq(book_find_1);
  //
  //   await c.close();
  //
  //
  //
  // }
  //
  //
  // @test
  // async 'entity lifecycle for integrated property with multiple references'() {
  //   const options = _.clone(TEST_STORAGE_OPTIONS);
  //   (<any>options).name = 'integrated_property';
  //
  //
  //   const Room = require('./schemas/integrated_property/Room').Room;
  //   const Equipment = require('./schemas/integrated_property/Equipment').Equipment;
  //
  //   registry.reload([Room, Equipment]);
  //
  //   const connect = await TestHelper.connect(options);
  //   const xsem = connect.controller;
  //   const ref = connect.ref;
  //   const c = await ref.connect() as TypeOrmConnectionWrapper;
  //
  //   let room_save_1 = new Room();
  //   room_save_1.number = 123;
  //   room_save_1.equipment = [];
  //
  //   let s = new Equipment();
  //   s.label = 'Seats';
  //   s.amount = 100;
  //   room_save_1.equipment.push(s);
  //
  //   s = new Equipment();
  //   s.label = 'Beamer';
  //   s.amount = 2;
  //   room_save_1.equipment.push(s);
  //
  //   room_save_1 = await xsem.save(room_save_1, {validate: false});
  //   // console.log(room_save_1);
  //   const data = await c.connection.query('select * from p_equipment');
  //   expect(data).to.have.length(2);
  //
  //   const room_found = await xsem.find(Room, {id: 1});
  //   expect(room_found).to.have.length(1);
  //
  //   const room_find_1 = room_found.shift();
  //   // console.log(room_find_1);
  //   expect(room_find_1).to.deep.eq(room_save_1);
  //
  //   await c.close();
  //
  // }
  //
  //
  // /**
  //  * TODO think over same properties for multiple entities which have different pk's
  //  */
}

