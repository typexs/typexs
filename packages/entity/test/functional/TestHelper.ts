import * as _ from 'lodash';
import {getMetadataArgsStorage} from 'typeorm';
import {
  EntityControllerApi,
  Injector,
  Invoker,
  REGISTRY_TYPEORM,
  SqliteSchemaHandler,
  TypeOrmEntityRegistry,
  TypeOrmStorageRef
} from '@typexs/base';
import {EntityController} from '../../src/libs/EntityController';
import {EntityRegistry} from '../../src/libs/EntityRegistry';
import {FrameworkFactory} from '../../src/libs/framework/FrameworkFactory';
import {RegistryFactory} from '@allgemein/schema-api';
import {TestHelper as _TestHelper} from '@typexs/testing';

export class TestHelper extends _TestHelper {

  static suiteName(filename: string) {
    return filename.split('/test/').pop();
  }

  static async connect(options: any): Promise<{ ref: TypeOrmStorageRef; controller: EntityController }> {

    RegistryFactory.register(REGISTRY_TYPEORM, TypeOrmEntityRegistry);
    RegistryFactory.register(/^typeorm\..*/, TypeOrmEntityRegistry);
    RegistryFactory.get(REGISTRY_TYPEORM);


    const invoker = new Invoker();
    [EntityControllerApi].forEach(api => {
      invoker.register(api, []);
    });
    Injector.set(Invoker.NAME, invoker);
    const ref = new TypeOrmStorageRef(options);
    const schemaHandler = Reflect.construct(SqliteSchemaHandler, [ref]) as SqliteSchemaHandler;
    await schemaHandler.initOnceByType();
    ref.setSchemaHandler(schemaHandler);
    await ref.prepare();
    const schemaDef = EntityRegistry.$().getSchemaRefByName(options.name);

    const framework = FrameworkFactory.$().get(ref);
    const xsem = new EntityController(options.name, schemaDef, ref, framework);
    await xsem.initialize();

    return {ref: ref, controller: xsem};
  }


  static resetTypeorm() {
    this.typeOrmReset();
    // PlatformTools.getGlobalVariable().typeormMetadataArgsStorage = null;
  }

}
