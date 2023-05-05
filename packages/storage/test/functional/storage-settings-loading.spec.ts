import { suite, test } from '@testdeck/mocha';
import { Bootstrap, Injector, IStorageRefOptions, ITypeOrmStorageRefOptions } from '@typexs/base';
import { expect } from 'chai';
import { TestHelper } from '@typexs/testing';
import { TEST_STORAGE_OPTIONS } from './config';
import { clone } from 'lodash';
import { StorageLoader } from '../../src/lib/StorageLoader';
import { SchemaApiSimpleEntity } from './data/dynamic-loading/entities/SchemaApiSimpleEntity';
import { StorageSetting } from '../../src/entities/storage/StorageSetting';
import { TestStorageSettings } from '../../src/ops/TestStorageSettings';
import { ActivateStorageSetting } from '../../src/ops/ActivateStorageSetting';

const LOG_EVENT = TestHelper.logEnable(false);

const settingsTemplate: any = {
  storage: {
    default: TEST_STORAGE_OPTIONS
  },

  app: { name: 'demo', path: __dirname + '/../../../../..', nodeId: 'storage' },

  logging: {
    enable: LOG_EVENT,
    level: 'debug',
    transports: [{ console: {} }]
  },

  modules: {
    paths: [
      TestHelper.root()
    ],
    disableCache: true,
    include: [
      '**/@allgemein{,/eventbus}*',
      '**/@typexs{,/base}*',
      '**/@typexs{,/entity}*',
      '**/@typexs{,/forms}*',
      '**/@typexs{,/storage}*'
    ]

  }

};

let bootstrap: Bootstrap = null;

@suite('functional/storage-settings-loader')
class StorageSettingsLoadingSpec {
  static async before() {
    Bootstrap.reset();

    const settings = clone(settingsTemplate);

    settings.storage.default.supportSchemaApi = true;
    settings.storage.default.extends = ['storage'];

    bootstrap = Bootstrap
      .setConfigSources([{ type: 'system' }])
      .configure(settings)
      .activateErrorHandling()
      .activateLogger();

    await bootstrap.prepareRuntime();
    await bootstrap.activateStorage();
    await bootstrap.startup();

  }

  static async after() {
    if (bootstrap) {
      await bootstrap.shutdown();
    }
  }


  @test
  async 'loaded'() {
    const loader = Injector.get(StorageLoader);
    expect(loader).to.be.not.null;
  }

  @test
  async 'create new storage ref'() {
    const loader = Injector.get(StorageLoader);
    expect(loader).to.be.not.null;
    const refOptions: IStorageRefOptions & any = {
      name: 'new_store',
      framework: 'typeorm',
      type: 'sqlite',
      database: ':memory:'
    };
    const ref = await loader.load(refOptions.name, refOptions);
    expect(ref).to.be.not.null;
  }

  @test
  async 'create new storage ref with entities'() {
    const loader = Injector.get(StorageLoader);
    expect(loader).to.be.not.null;
    const refOptions: ITypeOrmStorageRefOptions & any = {
      name: 'new_store_with_entities',
      framework: 'typeorm',
      type: 'sqlite',
      database: ':memory:',
      supportSchemaApi: true,
      // connectOnStartup: true,
      synchronize: true,
      // logger: 'simple-console',
      // logging: 'all',
      entities: [
        SchemaApiSimpleEntity
      ]
    };
    const ref = await loader.load(refOptions.name, refOptions);
    expect(ref).to.be.not.null;

    const entityRefs = ref.getEntityRefs();
    expect(entityRefs.map(x => x.name)).to.be.deep.eq(['SchemaApiSimpleEntity']);
    expect(entityRefs[0].getPropertyRefs()).to.have.length(5);

    const conn = await ref.connect();
    const collections = await ref.getRawCollectionNames();
    // console.log(collections);
    expect(collections).to.have.length.gt(0);

    conn.close();
    const x = new SchemaApiSimpleEntity();
    x.string = 'text';
    x.bool = true;
    x.nr = 12;
    x.date = new Date('2021-01-10T10:23:54.000Z');
    const result = await ref.getController().save(x);
    expect(result).to.be.deep.include({
      'string': 'text',
      'bool': true,
      'nr': 12,
      'date': new Date('2021-01-10T10:23:54.000Z'),
      'id': 1
    });
  }


  @test
  async 'create new storage ref with dynamic entities'() {
    const loader = Injector.get(StorageLoader);
    const refOptions: ITypeOrmStorageRefOptions & any = {
      name: 'new_store_with_dyna_entities',
      framework: 'typeorm',
      type: 'sqlite',
      database: ':memory:',
      supportSchemaApi: true,
      synchronize: true,
      // logger: 'simple-console',
      // logging: 'all',
      entities: [
        {
          $schema: 'http://json-schema.org/draft-07/schema#',
          definitions: {
            'JsonSchemaEntity': {
              'title': 'JsonSchemaEntity',
              'type': 'object',
              'metadata': {
                'type': 'regular'
              },
              'properties': {
                'id': {
                  'type': 'Number',
                  identifier: true,
                  generated: true
                },
                'firstName': {
                  'type': 'String'
                },
                'lastName': {
                  'type': 'String'
                }
              }
            }
          },
          $ref: '#/definitions/JsonSchemaEntity'
        }
      ]
    };


    const ref = await loader.load(refOptions.name, refOptions);
    expect(ref).to.be.not.null;

    const entityRefs = ref.getEntityRefs();
    expect(entityRefs.map(x => x.name)).to.be.deep.eq(['JsonSchemaEntity']);
    const entityRef = entityRefs[0];
    expect(entityRef.getPropertyRefs()).to.have.length(3);

    const conn = await ref.connect();
    const collections = await ref.getRawCollectionNames();
    // console.log(collections);
    expect(collections).to.have.length.gt(0);

    conn.close();
    const x = entityRef.create<any>(false);
    x.firstName = 'Mister';
    x.lastName = 'X';
    const result = await ref.getController().save(x);
    expect(result).to.be.deep.include({
      'firstName': 'Mister',
      'lastName': 'X',
      'id': 1
    });
  }


  @test
  async 'create storage settings and load refs'() {
    const refOptions: ITypeOrmStorageRefOptions & any = {
      name: 'new_dyna',
      framework: 'typeorm',
      type: 'sqlite',
      database: ':memory:',
      supportSchemaApi: true,
      synchronize: true,
      entities: [
        {
          $schema: 'http://json-schema.org/draft-07/schema#',
          definitions: {
            'DynaEntity': {
              'title': 'DynaEntity',
              'type': 'object',
              'metadata': {
                'type': 'regular'
              },
              'properties': {
                'id': {
                  'type': 'Number',
                  identifier: true,
                  generated: true
                },
                'someName': {
                  'type': 'String'
                },
                'someBool': {
                  'type': 'boolean'
                },
                'someNr': {
                  'type': 'number'
                }
              }
            }
          },
          $ref: '#/definitions/DynaEntity'
        }
      ]
    };

    const loader = Injector.get(StorageLoader);
    const ref = bootstrap.getStorage().get();

    let settings = new StorageSetting();
    settings.type = refOptions.type;
    settings.framework = refOptions.framework;
    settings.name = refOptions.name;
    settings.active = true;
    settings.options = refOptions;
    await ref.getController().save(settings);
    settings = await ref.getController().findOne(StorageSetting);
    const newRef = await loader.loadByStorageSetting(settings);
    expect(newRef.getOptions()).to.deep.include({
      name: 'new_dyna',
      framework: 'typeorm',
      type: 'sqlite',
      database: ':memory:'
    });
    const entityRefs = newRef.getEntityRefs();
    expect(entityRefs).to.have.length(1);
    const entityRef = entityRefs[0];
    let dynaInstance = entityRef.create<any>(false);
    dynaInstance.someName = 'TheName';
    dynaInstance.someBool = true;
    dynaInstance.someNr = 123;
    dynaInstance = await newRef.getController().save(dynaInstance);
    expect(dynaInstance).to.be.deep.include({ id: 1, someName: 'TheName', someBool: true, someNr: 123 });
  }


  @test
  async 'test a storage connection'() {
    const refOptions: ITypeOrmStorageRefOptions & any = {
      name: 'testname',
      framework: 'typeorm',
      type: 'sqlite',
      database: ':memory:',
      supportSchemaApi: true,
      synchronize: true,
      entities: [
        {
          $schema: 'http://json-schema.org/draft-07/schema#',
          definitions: {
            'DynaEntity': {
              'title': 'DynaEntity',
              'type': 'object',
              'metadata': {
                'type': 'regular'
              },
              'properties': {
                'id': {
                  'type': 'Number',
                  identifier: true,
                  generated: true
                },
                'someName': {
                  'type': 'String'
                },
                'someBool': {
                  'type': 'boolean'
                },
                'someNr': {
                  'type': 'number'
                }
              }
            }
          },
          $ref: '#/definitions/DynaEntity'
        }
      ]
    };


    const settings = new StorageSetting();
    settings.type = refOptions.type;
    settings.framework = refOptions.framework;
    settings.name = refOptions.name;
    settings.active = false;
    settings.options = refOptions;
    // await ref.getController().save(settings);

    const op = Injector.create(TestStorageSettings);
    const res = await op.doCall(settings);
    expect(res.success).to.be.true;
  }

  @test
  async 'activate a storage connection'() {
    const refOptions: ITypeOrmStorageRefOptions & any = {
      name: 'testconn',
      framework: 'typeorm',
      type: 'sqlite',
      database: ':memory:',
      supportSchemaApi: true,
      synchronize: true,
      entities: [
        {
          $schema: 'http://json-schema.org/draft-07/schema#',
          definitions: {
            'DynaEntity': {
              'title': 'DynaEntity',
              'type': 'object',
              'metadata': {
                'type': 'regular'
              },
              'properties': {
                'id': {
                  'type': 'Number',
                  identifier: true,
                  generated: true
                },
                'someName': {
                  'type': 'String'
                },
                'someBool': {
                  'type': 'boolean'
                },
                'someNr': {
                  'type': 'number'
                }
              }
            }
          },
          $ref: '#/definitions/DynaEntity'
        }
      ]
    };


    const settings = new StorageSetting();
    settings.type = refOptions.type;
    settings.framework = refOptions.framework;
    settings.name = refOptions.name;
    settings.active = false;
    settings.options = refOptions;
    // await ref.getController().save(settings);

    const op = Injector.create(ActivateStorageSetting);
    const res = await op.doCall(settings);
    expect(res.success).to.be.true;
    const loader = Injector.get(StorageLoader);
    expect(loader.isLoaded(settings.name)).to.be.true;
  }


  @test
  async 'deactivate a storage connection'() {
    const refOptions: ITypeOrmStorageRefOptions & any = {
      name: 'testconn_dec',
      framework: 'typeorm',
      type: 'sqlite',
      database: ':memory:',
      supportSchemaApi: true,
      synchronize: true,
      entities: [
        {
          $schema: 'http://json-schema.org/draft-07/schema#',
          definitions: {
            'DynaEntity': {
              'title': 'DynaEntity',
              'type': 'object',
              'metadata': {
                'type': 'regular'
              },
              'properties': {
                'id': {
                  'type': 'Number',
                  identifier: true,
                  generated: true
                },
                'someName': {
                  'type': 'String'
                },
                'someBool': {
                  'type': 'boolean'
                },
                'someNr': {
                  'type': 'number'
                }
              }
            }
          },
          $ref: '#/definitions/DynaEntity'
        }
      ]
    };


    const settings = new StorageSetting();
    settings.type = refOptions.type;
    settings.framework = refOptions.framework;
    settings.name = refOptions.name;
    settings.active = false;
    settings.options = refOptions;
    // await ref.getController().save(settings);

    const op = Injector.create(ActivateStorageSetting);
    let res = await op.doCall(settings);
    expect(res.success).to.be.true;

    const loader = Injector.get(StorageLoader);
    expect(loader.isLoaded(settings.name)).to.be.true;

    res = await op.doCall(settings, false);
    expect(res.success).to.be.true;
    expect(loader.isLoaded(settings.name)).to.be.false;

  }

}
