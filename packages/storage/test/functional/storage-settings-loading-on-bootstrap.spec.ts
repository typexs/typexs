import { suite, test } from '@testdeck/mocha';
import { Bootstrap, Config, Injector, IStorageRefOptions, RuntimeLoader, ITypeOrmStorageRefOptions } from '@typexs/base';
import { expect } from 'chai';
import { ClassRef, IJsonSchema7, IEntityRef } from '@allgemein/schema-api';
import { TestHelper } from '@typexs/testing';
import { TEST_STORAGE_OPTIONS } from './config';
import { clone } from 'lodash';
import { StorageLoader } from '../../src/lib/StorageLoader';
import { SchemaApiSimpleEntity } from './data/dynamic-loading/entities/SchemaApiSimpleEntity';
import { JsonSchema } from '@angular-devkit/core/src/json/schema';
import { StorageSetting } from '../../src/entities/storage/StorageSetting';
import * as os from 'os';
import { join } from 'path';
import * as fs from 'fs';

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


const refOptions: ITypeOrmStorageRefOptions & any = {
  name: 'boot_append',
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


let bootstrap: Bootstrap = null;
let settings: any = null;

@suite('functional/storage-settings-loader - bootstrap')
class StorageSettingsLoadingSpec {
  static async before() {
    Bootstrap.reset();

    settings = clone(settingsTemplate);

    settings.storage.default.supportSchemaApi = true;
    settings.storage.default.extends = ['storage'];
    settings.storage.default.database = join(os.tmpdir(), 'schema-loading.sqlite');

    bootstrap = Bootstrap
      .setConfigSources([{ type: 'system' }])
      .configure(settings)
      .activateErrorHandling()
      .activateLogger();

    await bootstrap.prepareRuntime();
    await bootstrap.activateStorage();
    await bootstrap.startup();
    const ref = Injector.get(StorageLoader);
    const setting = new StorageSetting();
    setting.framework = refOptions.framework;
    setting.type = refOptions.type;
    setting.name = refOptions.name;
    setting.active = true;
    setting.options = refOptions;
    await ref.getStorageRef().getController().save(setting);
    await bootstrap.shutdown();
  }

  static async after() {
    if (bootstrap) {
      await bootstrap.shutdown();
    }
    try {
      fs.unlinkSync(settings.storage.default.database);
    } catch (e) {

    }

  }


  @test
  async 'check if loading on startup works'() {
    Bootstrap.reset();

    settings = clone(settingsTemplate);

    settings.storage.default.supportSchemaApi = true;
    settings.storage.default.extends = ['storage'];
    settings.storage.default.database = join(os.tmpdir(), 'schema-loading.sqlite');

    bootstrap = Bootstrap
      .setConfigSources([{ type: 'system' }])
      .configure(settings)
      .activateErrorHandling()
      .activateLogger();

    await bootstrap.prepareRuntime();
    await bootstrap.activateStorage();
    await bootstrap.startup();
    const ref = Injector.get(StorageLoader);
    const setting = await ref.getStorageRef().getController().findOne(StorageSetting);
    expect(setting).to.be.deep.include({
      framework: refOptions.framework,
      type: refOptions.type,
      name: refOptions.name,
      active: true
    });

    const storageName = refOptions.name + '_1';
    const names = bootstrap.getStorage().getStorageRefs().map(x => x.getName());
    expect(names).to.deep.eq(['default', storageName]);

    const storageRef = bootstrap.getStorage().get(storageName);
    const dynaEntityType = storageRef.getEntityRef('DynaEntity') as IEntityRef;
    const dynaEntity = dynaEntityType.create<any>(false);
    dynaEntity.someName = 'HalloWelt';
    dynaEntity.someBool = false;
    dynaEntity.someNr = 123;
    await storageRef.getController().save(dynaEntity);
    const instances = await storageRef.getController().find(dynaEntityType.getClass());
    expect(instances).to.have.length(1);
    expect(instances.shift()).to.be.deep.include({
      id: 1,
      someName: 'HalloWelt',
      someBool: false,
      someNr: 123
    });
  }
}
