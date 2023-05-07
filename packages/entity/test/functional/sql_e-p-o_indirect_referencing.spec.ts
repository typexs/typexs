// process.env.SQL_LOG = '1';
import { expect } from 'chai';
import '../../src/libs/decorators/register';
import { suite, test } from '@testdeck/mocha';
import { TestHelper } from './TestHelper';
import { StorageRef, TypeOrmConnectionWrapper } from '@typexs/base';
import { RegistryFactory, STATE_KEY } from '@allgemein/schema-api';
import { EntityRegistry } from '../../src/libs/EntityRegistry';
import { NAMESPACE_BUILT_ENTITY } from '../../src/libs/Constants';
import { TEST_STORAGE_OPTIONS } from './config';
import { clone, set } from 'lodash';
import { EntityController } from '../../src';
import { inspect } from 'util';


const FINDOPT = {
  hooks: {
    abortCondition: (entityRef: any, propertyDef: any, results: any, op: any) => op.entityDepth > 1
  }
};


let registry: EntityRegistry;
let DynamicObject = null;
let EntityWithObject = null;
let EntityWithObjectArray = null;

let entityController: EntityController;
let storageRef: StorageRef;
let connection: TypeOrmConnectionWrapper;

@suite('functional/sql_e-p-o_indirect_referencing')
class SqlIndirectReferencingSpec {


  static async before() {
    // TypeOrmEntityRegistry.reset();
    // TestHelper.resetTypeorm();

    registry = RegistryFactory.get(NAMESPACE_BUILT_ENTITY);
    DynamicObject = require('./sceanrio/e-p-o-dynamic/DynamicObject').DynamicObject;
    EntityWithObject = require('./sceanrio/e-p-o-dynamic/EntityWithObject').EntityWithObject;
    EntityWithObjectArray = require('./sceanrio/e-p-o-dynamic/EntityWithObjectArray').EntityWithObjectArray;
    // const metadata = MetadataRegistry.$().getMetadata();


    registry.getEntityRefFor(EntityWithObject);
    registry.getEntityRefFor(EntityWithObjectArray);

    const options = clone(TEST_STORAGE_OPTIONS);
    set(options, 'name', 'e-p-o-dynamic');
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
      'entity_with_object',
      'p_entity_with_object_object',
      'o_dynamic_object',
      'entity_with_object_array',
      'p_entity_with_object_array_object'
    ]);

    const collections = await storageRef.getRawCollections([
      'entity_with_object',
      'p_entity_with_object_object',
      'o_dynamic_object',
      'entity_with_object_array',
      'p_entity_with_object_array_object'
    ]);

    expect(collections.find(x => x.name === 'entity_with_object').properties.map(x => x.name)).to.be.deep.eq([
      'id',
      'nr'
    ]);
    expect(collections.find(x => x.name === 'p_entity_with_object_object').properties.map(x => x.name)).to.be.deep.eq([
      'id',
      'source_type',
      'source_id',
      'source_seq_nr',
      'target_id'
    ]);
    expect(collections.find(x => x.name === 'o_dynamic_object').properties.map(x => x.name)).to.be.deep.eq([
      'id',
      'value'
    ]);
    expect(collections.find(x => x.name === 'entity_with_object_array').properties.map(x => x.name)).to.be.deep.eq([
      'id',
      'nr'
    ]);
    expect(collections.find(x => x.name === 'p_entity_with_object_array_object').properties.map(x => x.name)).to.be.deep.eq([
      'id',
      'source_type',
      'source_id',
      'source_seq_nr',
      'target_id'
    ]);
  }

  @test.skip
  async 'find entity with object (one-to-one) - empty '() {
  }


  @test
  async 'find entity with object (one-to-one) - with element'() {
    // create scenario
    await connection.query('insert into entity_with_object (`nr`) values (1);');
    let raw = await connection.query('select max(id) as maxId from entity_with_object;');
    const entityId = raw.shift().maxId;
    await connection.query('insert into o_dynamic_object (`value`) values ("test");');
    raw = await connection.query('select max(id) as maxId from o_dynamic_object;');
    const objectId = raw.shift().maxId;
    await connection.query(
      'insert into p_entity_with_object_object ' +
      '(`source_type`,`source_id`,`source_seq_nr`,`target_id`) values ' +
      '("entity_with_object",' + entityId + ',0,' + objectId + ');');
    raw = await connection.query('select max(id) as maxId from p_entity_with_object_object;');
    const relationId = raw.shift().maxId;

    const entry = await entityController.find('EntityWithObject', { id: entityId });
    expect(entry).to.have.length(1);
    expect(entry.shift()).to.be.deep.eq({
      id: entityId,
      nr: 1,
      object: { id: objectId, value: 'test' }
    });
  }

  @test
  async 'find entity with object array (one-to-many) - empty'() {
    await connection.query('insert into entity_with_object_array (`nr`) values (3);');
    const raw = await connection.query('select max(id) as maxId from entity_with_object_array;');
    const entityId = raw.shift().maxId;
    // await connection.query('insert into o_dynamic_object (`value`) values ("test1");');
    // raw = await connection.query('select max(id) as maxId from o_dynamic_object;');
    // const objectId = raw.shift().maxId;
    // await connection.query(
    //   'insert into p_entity_with_object_array_object ' +
    //   '(`source_type`,`source_id`,`source_seq_nr`,`target_id`) values ' +
    //   '("entity_with_object_array",' + entityId + ',0,' + objectId + ');');

    const entry = await entityController.find('EntityWithObjectArray', { id: entityId });
    expect(entry).to.have.length(1);
    expect(entry.shift()).to.be.deep.eq({
      id: entityId,
      nr: 3,
      object: []
    });
  }

  @test
  async 'find entity with object array (one-to-many) - one entry'() {
    await connection.query('insert into entity_with_object_array (`nr`) values (2);');
    let raw = await connection.query('select max(id) as maxId from entity_with_object_array;');
    const entityId = raw.shift().maxId;
    await connection.query('insert into o_dynamic_object (`value`) values ("test1");');
    raw = await connection.query('select max(id) as maxId from o_dynamic_object;');
    const objectId = raw.shift().maxId;
    await connection.query(
      'insert into p_entity_with_object_array_object ' +
      '(`source_type`,`source_id`,`source_seq_nr`,`target_id`) values ' +
      '("entity_with_object_array",' + entityId + ',0,' + objectId + ');');

    const entry = await entityController.find('EntityWithObjectArray', { id: entityId });
    expect(entry).to.have.length(1);
    expect(entry.shift()).to.be.deep.eq({
      id: entityId,
      nr: 2,
      object: [{ id: objectId, value: 'test1' }]
    });

  }


  @test
  async 'find entity with object array (one-to-many) - multi entry'() {
    await connection.query('insert into entity_with_object_array (`nr`) values (2);');
    let raw = await connection.query('select max(id) as maxId from entity_with_object_array;');
    const entityId = raw.shift().maxId;

    await connection.query('insert into o_dynamic_object (`value`) values ("test1");');
    raw = await connection.query('select max(id) as maxId from o_dynamic_object;');
    const objectId1 = raw.shift().maxId;

    await connection.query('insert into o_dynamic_object (`value`) values ("test2");');
    raw = await connection.query('select max(id) as maxId from o_dynamic_object;');
    const objectId2 = raw.shift().maxId;

    await connection.query(
      'insert into p_entity_with_object_array_object ' +
      '(`source_type`,`source_id`,`source_seq_nr`,`target_id`) values ' +
      '("entity_with_object_array",' + entityId + ',0,' + objectId1 + ');');

    await connection.query(
      'insert into p_entity_with_object_array_object ' +
      '(`source_type`,`source_id`,`source_seq_nr`,`target_id`) values ' +
      '("entity_with_object_array",' + entityId + ',1,' + objectId2 + ');');

    const entry = await entityController.find('EntityWithObjectArray', { id: entityId });
    expect(entry).to.have.length(1);
    expect(entry.shift()).to.be.deep.eq({
      id: entityId,
      nr: 2,
      object: [
        { id: objectId1, value: 'test1' },
        { id: objectId2, value: 'test2' }
      ]
    });

  }


  @test
  async 'find entity with object array (one-to-many) - multi entry - wrong seqNr'() {
    await connection.query('insert into entity_with_object_array (`nr`) values (2);');
    let raw = await connection.query('select max(id) as maxId from entity_with_object_array;');
    const entityId = raw.shift().maxId;

    await connection.query('insert into o_dynamic_object (`value`) values ("test1");');
    raw = await connection.query('select max(id) as maxId from o_dynamic_object;');
    const objectId1 = raw.shift().maxId;

    await connection.query('insert into o_dynamic_object (`value`) values ("test2");');
    raw = await connection.query('select max(id) as maxId from o_dynamic_object;');
    const objectId2 = raw.shift().maxId;

    await connection.query(
      'insert into p_entity_with_object_array_object ' +
      '(`source_type`,`source_id`,`source_seq_nr`,`target_id`) values ' +
      '("entity_with_object_array",' + entityId + ',1,' + objectId1 + ');');

    await connection.query(
      'insert into p_entity_with_object_array_object ' +
      '(`source_type`,`source_id`,`source_seq_nr`,`target_id`) values ' +
      '("entity_with_object_array",' + entityId + ',2,' + objectId2 + ');');

    const entry = await entityController.find('EntityWithObjectArray', { id: entityId });
    // console.log(inspect(entry, false, 10));
    expect(entry).to.have.length(1);
    const result = entry.shift();
    const objects = [];
    objects[0] = { id: objectId1, value: 'test1' };
    objects[1] = { id: objectId2, value: 'test2' };
    expect(result).to.be.deep.eq({
      id: entityId,
      nr: 2,
      object: objects
    });
  }


  @test.skip
  async 'find entity with object array (many-to-one)'() {
  }


  @test.skip
  async 'find entity with object array (many-to-many)'() {
  }


  @test
  async 'save new entity with new object (one-to-one)'() {
    const clazz = registry.getEntityRefFor('EntityWithObject');
    const entity = clazz.getClassRef().build({
      nr: 4,
      object: { value: 'save-test' }
    }, { skipClassNamespaceInfo: true });

    const entry = await entityController.save(entity);
    // console.log(entry);

    const entityObject = (await connection.query(
      'select * from entity_with_object where id = (select max(id) as maxId from entity_with_object);')).shift();
    const object = (await connection.query(
      'select * from o_dynamic_object where id = (select max(id) as maxId from o_dynamic_object);')).shift();
    const relation = (await connection.query(
      'select * from p_entity_with_object_object where id = (select max(id) as maxId from p_entity_with_object_object);')).shift();
    expect(entityObject).to.deep.eq({ id: entityObject.id, nr: 4 });
    expect(object).to.deep.eq({ id: object.id, value: 'save-test' });
    expect(relation).to.deep.eq({
      id: relation.id, source_type: 'entity_with_object',
      source_id: entityObject.id,
      source_seq_nr: 0,
      target_id: object.id
    });
    delete entry[STATE_KEY];
    expect(entry).to.deep.eq({
      id: entityObject.id,
      nr: 4,
      object: {
        value: 'save-test',
        id: object.id
      }
    });
  }


  @test.skip
  async 'update by save method (one-to-one) - value changes'() {
  }


  @test.skip
  async 'update by save method (one-to-one) - remove object'() {
  }


  @test
  async 'save new entity with new object array (one-to-many)'() {
    const clazz = registry.getEntityRefFor('EntityWithObjectArray');
    const entity = clazz.getClassRef().build({
      nr: 5,
      object: [{ value: 'save-test-1' }, { value: 'save-test-2' }]
    }, { skipClassNamespaceInfo: true });

    const entry = await entityController.save(entity);

    const entityObject = (await connection.query(
      'select * from entity_with_object_array where id = (select max(id) as maxId from entity_with_object_array);')).shift();
    const object = (await connection.query(
      'select * from o_dynamic_object where id >= (select max(id) as maxId from o_dynamic_object) - 1;'));
    const relation = (await connection.query(
      'select * from p_entity_with_object_array_object where id >= (select max(id) as maxId from p_entity_with_object_array_object) - 1;'));

    // console.log(entry, entityObject, object, relation);

    expect(entityObject).to.deep.eq({ id: entityObject.id, nr: 5 });
    expect(object).to.deep.eq([{ id: object[0].id, value: 'save-test-1' }, { id: object[1].id, value: 'save-test-2' }]);
    expect(relation).to.deep.eq([{
      id: relation[0].id, source_type: 'entity_with_object_array',
      source_id: entityObject.id,
      source_seq_nr: 0,
      target_id: object[0].id
    }, {
      id: relation[1].id, source_type: 'entity_with_object_array',
      source_id: entityObject.id,
      source_seq_nr: 1,
      target_id: object[1].id
    }]);
    delete entry[STATE_KEY];
    expect(entry).to.deep.eq({
      id: entityObject.id,
      nr: 5,
      object: [
        {
          value: 'save-test-1',
          id: object[0].id
        },
        {
          value: 'save-test-2',
          id: object[1].id
        }]
    });
  }


  @test
  async 'save entity with object array adding new entry (one-to-many)'() {
    const clazz = registry.getEntityRefFor('EntityWithObjectArray');
    const entity = clazz.getClassRef().build({
      nr: 6,
      object: [{ value: 'save-test-3' }]
    }, { skipClassNamespaceInfo: true });

    let entry = await entityController.save(entity) as any;
    entry.object.push({ value: 'save-test-5' });
    delete entry[STATE_KEY];
    expect(entry).to.deep.eq({
      id: entry.id,
      nr: 6,
      object: [
        {
          value: 'save-test-3',
          id: entry.object[0].id
        },
        {
          value: 'save-test-5'
        }
      ]
    });

    entry = await entityController.save(entry) as any;
    delete entry[STATE_KEY];
    expect(entry).to.deep.eq({
      id: entry.id,
      nr: 6,
      object: [
        {
          value: 'save-test-3',
          id: entry.object[0].id
        },
        {
          value: 'save-test-5',
          id: entry.object[1].id
        }
      ]
    });

    const entityObject = (await connection.query(
      'select * from entity_with_object_array where id = (select max(id) as maxId from entity_with_object_array);')).shift();
    const object = (await connection.query(
      'select * from o_dynamic_object where id >= (select max(id) as maxId from o_dynamic_object) - 1;'));
    const relation = (await connection.query(
      'select * from p_entity_with_object_array_object where id >= (select max(id) as maxId from p_entity_with_object_array_object) - 1;'));

    // console.log(entry, entityObject, object, relation);

    expect(entityObject).to.deep.eq({ id: entityObject.id, nr: 6 });
    expect(object).to.deep.eq([{ id: object[0].id, value: 'save-test-3' }, { id: object[1].id, value: 'save-test-5' }]);
    expect(relation).to.deep.eq([{
      id: relation[0].id, source_type: 'entity_with_object_array',
      source_id: entityObject.id,
      source_seq_nr: 0,
      target_id: object[0].id
    }, {
      id: relation[1].id, source_type: 'entity_with_object_array',
      source_id: entityObject.id,
      source_seq_nr: 1,
      target_id: object[1].id
    }]);
  }


  @test
  async 're-save entity with object array - multi value (one-to-many)'() {
    const clazz = registry.getEntityRefFor('EntityWithObjectArray');
    const entity = clazz.getClassRef().build({
      nr: 7,
      object: [
        { value: 'save-test-7' },
        { value: 'save-test-8' }
      ]
    }, { skipClassNamespaceInfo: true });

    let entry = await entityController.save(entity) as any;
    entry = await entityController.findOne(clazz.getClass(), { id: entry.id }) as any;
    expect(entry).to.deep.eq(
      {
        'id': entry.id,
        'nr': 7,
        'object': [
          {
            'id': entry.object[0].id,
            'value': 'save-test-7'
          },
          {
            'id': entry.object[1].id,
            'value': 'save-test-8'
          }
        ]
      }
    );

    entry = await entityController.save(entry) as any;
    entry = await entityController.findOne(clazz.getClass(), { id: entry.id }) as any;
    expect(entry).to.deep.eq(
      {
        'id': entry.id,
        'nr': 7,
        'object': [
          {
            'id': entry.object[0].id,
            'value': 'save-test-7'
          },
          {
            'id': entry.object[1].id,
            'value': 'save-test-8'
          }
        ]
      }
    );

    const relation = (await connection.query(
      'select * from p_entity_with_object_array_object where id >= (select max(id) as maxId from p_entity_with_object_array_object) - 1;'));

    expect(relation).to.deep.eq([{
      id: relation[0].id,
      source_type: 'entity_with_object_array',
      source_id: entry.id,
      source_seq_nr: 0,
      target_id: entry.object[0].id
    }, {
      id: relation[1].id,
      source_type: 'entity_with_object_array',
      source_id: entry.id,
      source_seq_nr: 1,
      target_id: entry.object[1].id
    }]);
  }


  @test.skip
  async 'save entity with object array changing value of an entry (one-to-many)'() {
  }


  @test
  async 'save entity with object array removing last entry (one-to-many)'() {
    const clazz = registry.getEntityRefFor('EntityWithObjectArray');
    const entity = clazz.getClassRef().build({
      nr: 7,
      object: [{ value: 'save-test-8' }, { value: 'save-test-9' }]
    }, { skipClassNamespaceInfo: true });

    let entry = await entityController.save(entity) as any;
    delete entry[STATE_KEY];
    expect(entry).to.deep.eq({
      id: entry.id,
      nr: 7,
      object: [
        {
          value: 'save-test-8',
          id: entry.object[0].id
        },
        {
          value: 'save-test-9',
          id: entry.object[1].id
        }
      ]
    });


    const beforeRelation = (await connection.query(
      // eslint-disable-next-line max-len
      'select * from p_entity_with_object_array_object where source_id = ' + entry.id + ';'));

    // const beforeObject = (await connection.query(
    //   'select * from o_dynamic_object where id >= (select max(id) as maxId from o_dynamic_object) - 1;'));


    entry.object.pop();
    const cloneChange = clone(entry);
    entry = await entityController.save(entry) as any;
    entry = await entityController.findOne(clazz.getClass(), { id: entry.id });

    const afterObject = (await connection.query(
      'select * from o_dynamic_object where id >= (select max(id) as maxId from o_dynamic_object) - 1;'));
    const afterRelation = (await connection.query(
      // eslint-disable-next-line max-len
      'select * from p_entity_with_object_array_object where source_id = ' + entry.id + ';'));
    // console.log(cloneChange, entry, beforeObject, beforeRelation, afterObject, afterRelation);

    delete entry[STATE_KEY];
    expect(entry).to.deep.eq(cloneChange);
    expect(beforeRelation[0]).to.be.deep.eq(afterRelation[0]);
    expect(beforeRelation.length - 1).to.be.eq(afterRelation.length);
    expect(afterRelation).to.be.deep.eq([{
      'id': afterRelation[0].id,
      'source_id': entry.id,
      'source_seq_nr': 0,
      'source_type': 'entity_with_object_array',
      'target_id': entry.object[0].id
    }]);
  }


  @test
  async 'save entity with object array removing first entry (one-to-many)'() {
    const clazz = registry.getEntityRefFor('EntityWithObjectArray');
    const entity = clazz.getClassRef().build({
      nr: 8,
      object: [{ value: 'save-test-10' }, { value: 'save-test-11' }]
    }, { skipClassNamespaceInfo: true });

    let entry = await entityController.save(entity) as any;
    delete entry[STATE_KEY];
    expect(entry).to.deep.eq({
      id: entry.id,
      nr: 8,
      object: [
        {
          value: 'save-test-10',
          id: entry.object[0].id
        },
        {
          value: 'save-test-11',
          id: entry.object[1].id
        }
      ]
    });


    const beforeRelation = (await connection.query(
      // eslint-disable-next-line max-len
      'select * from p_entity_with_object_array_object where source_id = ' + entry.id + ';'));

    entry.object.shift();
    const cloneChange = clone(entry);
    entry = await entityController.save(entry) as any;
    entry = await entityController.findOne(clazz.getClass(), { id: entry.id });

    // const afterObject = (await connection.query(
    //   'select * from o_dynamic_object where id >= (select max(id) as maxId from o_dynamic_object) - 1;'));
    const afterRelation = (await connection.query(
      // eslint-disable-next-line max-len
      'select * from p_entity_with_object_array_object where source_id = ' + entry.id + ';'));

    delete entry[STATE_KEY];
    expect(entry).to.deep.eq(cloneChange);
    expect(beforeRelation.length - 1).to.be.eq(afterRelation.length);
    expect(afterRelation).to.be.deep.eq([{
      'id': afterRelation[0].id,
      'source_id': entry.id,
      'source_seq_nr': 0,
      'source_type': 'entity_with_object_array',
      'target_id': entry.object[0].id
    }]);
    beforeRelation[1].source_seq_nr = 0;
    expect(beforeRelation[1]).to.be.deep.eq(afterRelation[0]);
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

