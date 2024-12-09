import { suite, test } from '@testdeck/mocha';
import { expect } from 'chai';

import { Car } from './entities/Car';
import { RegistryFactory } from '@allgemein/schema-api';
import { TypeOrmEntityRegistry } from '../../../../src/libs/storage/framework/typeorm/schema/TypeOrmEntityRegistry';
import { TypeOrmEntityRef } from '../../../../src/libs/storage/framework/typeorm/schema/TypeOrmEntityRef';
import { REGISTRY_TYPEORM } from '../../../../src/libs/storage/framework/typeorm/Constants';
import { Invoker } from '../../../../src/base/Invoker';
import { Injector } from '../../../../src/libs/di/Injector';
import { TypeOrmStorageRef } from '../../../../src/libs/storage/framework/typeorm/TypeOrmStorageRef';
import { TEST_STORAGE_OPTIONS } from '../../config';
import { IStorageRefOptions } from '../../../../src/libs/storage/IStorageRefOptions';
import { BaseConnectionOptions } from 'typeorm/connection/BaseConnectionOptions';
import { TreeUtils } from '@allgemein/base';
import { cloneDeep } from '@typexs/generic';


let registry: TypeOrmEntityRegistry = null;
let storageOptions: IStorageRefOptions & BaseConnectionOptions = null;
let EntityPassName: Function = null;


@suite('functional/storage/typeorm/json-schema-support')
class JsonSchemaSupportSpec {

  static async before() {
    RegistryFactory.remove(REGISTRY_TYPEORM);
    RegistryFactory.register(REGISTRY_TYPEORM, TypeOrmEntityRegistry);
    RegistryFactory.register(/^typeorm\..*/, TypeOrmEntityRegistry);
    EntityPassName = require('./entities/EntityPassName').EntityPassName;

    registry = RegistryFactory.get(REGISTRY_TYPEORM) as TypeOrmEntityRegistry;
    await registry.ready();
    const invoker = new Invoker();
    Injector.set(Invoker.NAME, invoker);
  }

  before() {
    storageOptions = cloneDeep(TEST_STORAGE_OPTIONS) as IStorageRefOptions & BaseConnectionOptions;
  }


  after() {
    RegistryFactory.remove(REGISTRY_TYPEORM);
  }

  @test
  async 'generate json schema for passing entity name'() {
    // const EntityPassName = require('./entities/EntityPassName').EntityPassName;
    const regEntityDef = registry.getEntityRefFor(EntityPassName);
    expect(regEntityDef.name).to.be.eq('passing_other_name');
    expect(regEntityDef.getClassRef().name).to.be.eq('EntityPassName');
    const data = regEntityDef.toJsonSchema();
    expect(JSON.parse(JSON.stringify(data))).to.deep.eq({
      '$ref': '#/definitions/passing_other_name',
      '$schema': 'http://json-schema.org/draft-07/schema#',
      'definitions': {
        'passing_other_name': {
          '$id': '#passing_other_name',
          'metadata': {
            'name': 'passing_other_name',
            'type': 'regular'
          },
          'properties': {
            'id': {
              'auto': true,
              'metadata': {
                'mode': 'regular',
                'options': {
                  'name': 'id'
                },
                'propertyName': 'id'
              },
              'tableType': 'column',
              'type': 'number'
            },
            'value': {
              'metadata': {
                'mode': 'regular',
                'options': {
                  'name': 'value'
                },
                'propertyName': 'value'
              },
              'tableType': 'column',
              'type': 'string'
            }
          },
          'schema': [
            'default'
          ],
          'title': 'EntityPassName',
          'type': 'object'
        }
      }
    });
  }

  @test
  async 'generate json schema and replay it after class changes back'() {
    const regEntityDef = registry.getEntityRefFor(Car);
    expect(regEntityDef.getPropertyRefs()).to.have.length(3);
    const data = regEntityDef.toJsonSchema();
    const data_x = JSON.parse(JSON.stringify(data));
    // correct for mfull testing
    await TreeUtils.walkAsync(data_x, x => {
      if (x.key === 'type' && (x.value === 'varchar' || x.value === 'int')) {
        delete x.parent[x.key];
      }
    });
    expect(data_x).to.deep.eq({
      $schema: 'http://json-schema.org/draft-07/schema#',
      definitions: {
        Car: {
          $id: '#Car',
          title: 'Car',
          type: 'object',
          metadata: {
            type: 'regular'
          },
          'schema': [
            'default'
          ],
          properties: {
            id: {
              type: 'number',
              'identifier': true,
              metadata: {
                propertyName: 'id',
                mode: 'regular',
                options: { primary: true }
              },
              tableType: 'column'
            },
            name: {
              type: 'string',
              metadata: { propertyName: 'name', mode: 'regular', options: {} },
              tableType: 'column'
            },
            driver: {
              type: 'array',
              items: { '$ref': '#/definitions/Driver' },
              metadata: {
                propertyName: 'driver',
                isLazy: false,
                relationType: 'one-to-many',
                options: {}
              },
              tableType: 'relation'
            }
          }
        },
        Driver: {
          $id: '#Driver',
          title: 'Driver',
          type: 'object',
          metadata: { type: 'regular' },
          'schema': [
            'default'
          ],
          properties: {
            id: {
              type: 'number',
              'identifier': true,
              metadata: {
                propertyName: 'id',
                mode: 'regular',
                options: { primary: true }
              },
              tableType: 'column'
            },
            firstName: {
              type: 'string',
              metadata: { propertyName: 'firstName', mode: 'regular', options: {} },
              tableType: 'column'
            },
            lastName: {
              type: 'string',
              metadata: { propertyName: 'lastName', mode: 'regular', options: {} },
              tableType: 'column'
            },
            car: {
              $ref: '#/definitions/Car',
              metadata: {
                propertyName: 'car',
                relationType: 'many-to-one',
                isLazy: false,
                options: {}
              },
              tableType: 'relation'
            }
          }
        }
      },
      '$ref': '#/definitions/Car'
    });

    data_x.definitions['Car2'] = cloneDeep(data_x.definitions['Car']);
    data_x.definitions['Car2'].title = 'Car2';
    data_x.definitions['Car2'].$id = '#Car2';
    data_x.definitions['Car2'].metadata.name = 'Car2';
    data_x.$ref = '#/definitions/Car2';

    const entityDef2 = await registry.fromJsonSchema(cloneDeep(data_x)) as TypeOrmEntityRef;
    expect(entityDef2.getPropertyRefs()).to.have.length(3);
    let data2 = entityDef2.toJsonSchema();
    data2 = JSON.parse(JSON.stringify(data2));
    await TreeUtils.walkAsync(data2, x => {
      if (x.key === 'options') {
        delete x.parent[x.key];
      }
    });
    await TreeUtils.walkAsync(data_x, x => {
      if (x.key === 'options') {
        delete x.parent[x.key];
      }
    });
    expect(data2).to.deep.eq(data_x);
  }


  @test
  async 'register simple entity from parsed json schema'() {
    const jsonSchema = {
      '$schema': 'http://json-schema.org/draft-07/schema#',
      definitions: {
        PersonSchema: {
          title: 'PersonSchema',
          type: 'object',
          properties: {
            id: {
              type: 'number',
              identifier: true
            },
            firstName: {
              type: 'string'
            },
            lastName: {
              type: 'string'
            }
          }
        }
      },
      '$ref': '#/definitions/PersonSchema'
    };

    const entityDef = await registry.fromJsonSchema(jsonSchema) as TypeOrmEntityRef;
    const properties = entityDef.getPropertyRefs();
    expect(properties).to.have.length(3);
    const idProperty = properties.find(x => x.name === 'id');
    expect(idProperty.isIdentifier()).to.be.true;

    const storage = new TypeOrmStorageRef(storageOptions);
    await storage.initialize();
    await storage.prepare();

    // add annotated class
    storage.addEntityType(entityDef.getClass());
    // storage.addTableEntityClass(EntityOfSchemaApi, 'schema_api_table');
    await storage.reload();
    expect(storage['options'].entities).has.length(1);

    const c = await storage.connect();
    const q = await c.query('SELECT * FROM sqlite_master WHERE type = \'table\' ;');
    await storage.shutdown(true);

    expect(q).has.length(1);
    expect(q[0].sql).to.be.eq(
      'CREATE TABLE "PersonSchema" ("id" integer PRIMARY KEY NOT NULL, "first_name" varchar NOT NULL, "last_name" varchar NOT NULL)'
    );
  }

}

