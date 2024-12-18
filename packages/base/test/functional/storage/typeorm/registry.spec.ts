import { get } from '@typexs/generic';


import { expect } from 'chai';
import { suite, test } from '@testdeck/mocha';
import { TypeOrmEntityRegistry } from '../../../../src/libs/storage/framework/typeorm/schema/TypeOrmEntityRegistry';
import { House } from './entities/House';
import { EntityWithDbSchema } from './entities/EntityWithDbSchema';
import { Column, Entity, getMetadataArgsStorage } from 'typeorm';
import { RegistryFactory, SchemaUtils } from '@allgemein/schema-api';
import { REGISTRY_TYPEORM } from '../../../../src/libs/storage/framework/typeorm/Constants';
import { EntityPassInternalName } from './entities/EntityPassInternalName';
import { EntityDoubleLoad } from './entities/EntityDoubleLoad';

let registry: TypeOrmEntityRegistry = null;

@suite('functional/storage/typeorm/registry')
class StorageTypeormRegistrySpec {

  static before() {
    RegistryFactory.register(REGISTRY_TYPEORM, TypeOrmEntityRegistry);
    RegistryFactory.register(/^typeorm\..*/, TypeOrmEntityRegistry);
  }

  before() {
    registry = RegistryFactory.get(REGISTRY_TYPEORM) as TypeOrmEntityRegistry;
  }

  after() {
    if (registry) {
      registry.reset();
    }
    RegistryFactory.remove(REGISTRY_TYPEORM);
  }

  @test
  async 'register imported'() {
    const metadata = getMetadataArgsStorage();
    const entityRef = registry.getEntityRefFor(House);
    const properties = entityRef.getPropertyRefs();

    const targets = metadata.tables.filter(x => get(x, 'target.name', null) === 'House');
    const columns = metadata.columns.filter(x => get(x, 'target.name', null) === 'House');

    expect(entityRef).to.not.be.null;
    expect(targets).to.have.length(1);
    expect(properties).to.have.length(3);
    expect(columns).to.have.length(3);

  }


  @test
  async 'register on the fly import'() {
    const metadata = getMetadataArgsStorage();
    const onTheFly = require('./entities/HouseOnTheFly').HouseOnTheFly;
    const entityRefImported = registry.getEntityRefFor(House);
    const entityRef = registry.getEntityRefFor(onTheFly);
    const entities = registry.listEntities();
    const properties = registry.listProperties();


    const targets = metadata.tables.filter(x => get(x, 'target.name', '').startsWith('House'));
    const columns = metadata.columns.filter(x => get(x, 'target.name', '').startsWith('House'));

    expect(entityRef).to.not.be.null;
    expect(targets).to.have.length(2);
    expect(entities).to.have.length(2);
    expect(columns).to.have.length(6);
    expect(properties).to.have.length(6);
  }


  @test
  async 'register dynamically created entity'() {
    const metadata = getMetadataArgsStorage();

    let targets = metadata.tables.filter(x => get(x, 'target.name', '').startsWith('HouseOf'));
    expect(targets).to.have.length(0);
    const clazz = SchemaUtils.clazz('HouseOfDance');
    Entity()(clazz);

    targets = metadata.tables.filter(x => get(x, 'target.name', '').startsWith('HouseOf'));
    expect(targets).to.have.length(1);
    let entities = registry.listEntities();
    expect(entities).to.have.length(0);
    const entityRef = registry.getEntityRefFor(clazz);

    entities = registry.listEntities();
    expect(entities).to.have.length(1);

    let properties = registry.listProperties();
    expect(properties).to.have.length(0);
    let columns = metadata.columns.filter(x => get(x, 'target.name', '').startsWith('HouseOf'));
    expect(columns).to.have.length(0);
    Column({ type: 'string' })({ constructor: clazz }, 'greatColumn');

    properties = registry.listProperties();
    expect(properties).to.have.length(1);

    columns = metadata.columns.filter(x => get(x, 'target.name', '').startsWith('HouseOf'));
    expect(columns).to.have.length(1);
  }


  @test
  async 'register entity with db schema'() {
    const metadata = getMetadataArgsStorage();
    const entityRef = registry.getEntityRefFor(EntityWithDbSchema);
    const properties = entityRef.getPropertyRefs();
    const target = metadata.tables.find(x => get(x, 'target.name', null) === 'EntityWithDbSchema');
    const columns = metadata.columns.filter(x => get(x, 'target.name', null) === 'EntityWithDbSchema');

    expect(entityRef).to.not.be.null;
    expect(target).to.deep.eq({
      name: 'passing_other_name',
      schema: 'test',
      target: EntityWithDbSchema,
      type: 'regular'
    });
    expect(properties).to.have.length(2);
    expect(columns).to.have.length(2);
  }


  /**
   * Check if internal name is correctly passed to typeorm metadata for table
   */
  @test
  async 'register entity with db internal table name'() {
    const metadata = getMetadataArgsStorage();
    const entityRef = registry.getEntityRefFor(EntityPassInternalName);

    const target = metadata.tables.find(x => get(x, 'target.name', null) === 'EntityPassInternalName');
    expect(target).to.deep.eq({
      target: EntityPassInternalName,
      type: 'regular',
      name: 'passing_other_internal_name'
    });

    expect(entityRef).to.not.be.null;
    expect(entityRef.getTableName()).to.be.eq('passing_other_internal_name');
    expect(entityRef.name).to.be.eq('EntityPassInternalName');
    expect(entityRef.getClassRef().name).to.be.eq('EntityPassInternalName');

  }


  /**
   * Check that multiple creation of entity refs is prevented
   */
  @test
  async 'check that double loading is prevented'() {
    const entityRef1 = registry.getEntityRefFor(EntityDoubleLoad);
    const entityRef2 = registry.getEntityRefFor(EntityDoubleLoad);
    const entityRef3 = registry.getEntityRefByName('EntityDoubleLoad');
    const entityRef4 = registry.getEntityRefByName('passing_double_load');

    expect(entityRef1).to.be.eq(entityRef2);
    expect(entityRef1).to.be.eq(entityRef3);
    expect(entityRef1).to.be.eq(entityRef4);

  }

}
