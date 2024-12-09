
import { suite, test } from '@testdeck/mocha';
import { expect } from 'chai';
import { Bootstrap, Injector, Storage } from '@typexs/base';
import * as path from 'path';
import { C_LDAP } from '../../src/lib/Constants';
import { TestHelper } from '@typexs/testing';
import { LdapStorageRef } from '../../src/lib/storage/LdapStorageRef';
import { CONFIG_01 } from './instances/configuration_01';
import { cloneDeep, defaultsDeep } from 'lodash';
import { LDAP_CONFIG } from './config';


let bootstrap: Bootstrap = null;



@suite('functional/ldap/configuration')
class TypexsLdapConnection {


  async before() {
    Bootstrap.reset();
  }

  async after() {
    if (bootstrap) {
      await bootstrap.shutdown();
    }
    Bootstrap.reset();
  }


  @test
  async 'check if framework is correctly loaded'() {
    bootstrap = await TestHelper.bootstrap(defaultsDeep(cloneDeep(CONFIG_01), {
      storage: {
        ldap: LDAP_CONFIG
      }
    }));
    const storage = Injector.get<Storage>(Storage.NAME);
    const storageFrameworks =  Object.keys(storage.storageFramework);
    expect(storageFrameworks).to.include(C_LDAP);
  }

  @test
  async 'check if ldap storage ref is correctly created'() {
    bootstrap = await TestHelper.bootstrap(defaultsDeep(cloneDeep(CONFIG_01), {
      storage: {
        ldap: LDAP_CONFIG
      }
    }));
    const storageRef = Injector.get<LdapStorageRef>('storage.ldap');
    expect(storageRef).to.not.be.null;
    expect(storageRef.getOptions().url).to.be.eq(LDAP_CONFIG.url);
  }

  // @test
  // async 'check if default connection works'() {
  //   await beforeCall(testConfig[1]);
  //   const storageRef = Injector.get<ElasticStorageRef>('storage.elastic');
  //   expect(storageRef).to.be.instanceOf(ElasticStorageRef);
  //   const data = storageRef.getRawCollectionNames();
  //   expect(data).to.be.deep.eq(['core.test_entity']);
  //   const indicies = storageRef.getAliasNames();
  //   expect(indicies).to.be.deep.eq(['core']);
  //   const indexTypes = storageRef.getIndexTypes();
  //   expect(indexTypes.map(t => ({ aliasName: t.getAliasName(), typeName: t.getTypeName() }))).to.be.deep.eq([{
  //     aliasName: 'core',
  //     typeName: 'test_entity'
  //   }]);
  //
  //   // create new index
  //   const checkIndex = await storageRef.checkIndices();
  //   expect(checkIndex).to.be.deep.eq({ core_xdx: true });
  //   expect(storageRef.isChecked()).to.be.true;
  //   storageRef.resetCheck();
  //
  //   // no change index
  //   const checkIndex2 = await storageRef.checkIndices();
  //   expect(checkIndex2).to.be.deep.eq({ core_xdx: true });
  //   expect(storageRef.isChecked()).to.be.true;
  //   storageRef.resetCheck();
  //
  //   // extend index
  //   process.env.ES_EXT_NEW = '1';
  //   const checkIndexAdd = await storageRef.checkIndices();
  //   expect(checkIndexAdd).to.be.deep.eq({ core_xdx: true });
  //   delete process.env.ES_EXT_NEW;
  //   expect(storageRef.isChecked()).to.be.true;
  //   storageRef.resetCheck();
  //
  //   process.env.ES_EXT_UPDATE = '1';
  //   const checkIndexUpdate = await storageRef.checkIndices();
  //   expect(checkIndexUpdate).to.be.deep.eq({ core_xdx: true });
  //   delete process.env.ES_EXT_UPDATE;
  //   expect(storageRef.isChecked()).to.be.true;
  //   storageRef.resetCheck();
  // }
  //
  //
  // @test
  // async 'check if dynamic index name creation works'() {
  //   await beforeCall(testConfig[2]);
  //   const storage = Injector.get<Storage>(Storage.NAME);
  //   const storageFrameworks =  Object.keys(storage.storageFramework);
  //   expect(storageFrameworks).to.include(C_SEARCH_INDEX);
  //
  //   const elasticRef = storage.get(C_ELASTIC_SEARCH);
  //   expect(elasticRef).to.be.instanceOf(ElasticStorageRef);
  //
  //   const storageRef = Injector.get<ElasticStorageRef>('storage.elastic');
  //   expect(storageRef).to.be.instanceOf(ElasticStorageRef);
  //   expect(storageRef).to.eq(elasticRef);
  //   const indicies = storageRef.getAliasNames();
  //   expect(indicies).to.be.deep.eq(['typeorm_default_test_entity']);
  //   const checkIndex2 = await storageRef.checkIndices();
  //   expect(checkIndex2).to.be.deep.eq({ typeorm_default_test_entity_xdx: true });
  //   expect(storageRef.isChecked()).to.be.true;
  //   storageRef.resetCheck();
  //
  // }
  //
  //
  // @test
  // async 'check if dynamic index name creation works - for schema entities'() {
  //   await beforeCall(testConfig[5]);
  //   const storage = Injector.get<Storage>(Storage.NAME);
  //   const storageFrameworks =  Object.keys(storage.storageFramework);
  //   expect(storageFrameworks).to.include(C_SEARCH_INDEX);
  //
  //   const elasticRef = storage.get(C_ELASTIC_SEARCH);
  //   expect(elasticRef).to.be.instanceOf(ElasticStorageRef);
  //
  //   const storageRef = Injector.get<ElasticStorageRef>('storage.elastic');
  //   expect(storageRef).to.be.instanceOf(ElasticStorageRef);
  //   expect(storageRef).to.eq(elasticRef);
  //   const indicies = storageRef.getAliasNames();
  //   expect(indicies).to.be.deep.eq(['built_entity_default_entity_by_schema_api']);
  //   const checkIndex2 = await storageRef.checkIndices();
  //   expect(checkIndex2).to.be.deep.eq({ built_entity_default_entity_by_schema_api_xdx: true });
  //   expect(storageRef.isChecked()).to.be.true;
  //   storageRef.resetCheck();
  //
  // }
  //
  //
  // @test
  // async 'check if pattern entity class matches'() {
  //   await beforeCall(testConfig[3]);
  //
  //   const storageRef = Injector.get<ElasticStorageRef>('storage.elastic');
  //   expect(storageRef).to.be.instanceOf(ElasticStorageRef);
  //
  //
  //   expect(storageRef.hasEntityClass('*')).to.be.true;
  //   expect(storageRef.hasEntityClass('*Idx')).to.be.true;
  //   expect(storageRef.hasEntityClass('*_idx')).to.be.true;
  //   expect(storageRef.hasEntityClass('TestEn*')).to.be.true;
  //   expect(storageRef.hasEntityClass('TesterEntity')).to.be.false;
  //   expect(storageRef.hasEntityClass('TesterEntityIdx')).to.be.false;
  //   expect(storageRef.hasEntityClass('*Entity')).to.be.false;
  //   expect(storageRef.hasEntityClass('TestEntityIdx,RegistryEntityIdx')).to.be.true;
  //   expect(storageRef.hasEntityClass('Test*Idx,Registry*Idx')).to.be.true;
  //   expect(storageRef.hasEntityClass('TestT*Idx,RegistryP*Idx')).to.be.false;
  //   expect(storageRef.hasEntityClass('Test*Idx,RegistryP*Idx')).to.be.true;
  //
  //   expect(storageRef.getEntityRef('*').map((x: any) => x.name)).to.be.deep.eq([
  //     'TestEntityIdx',
  //     'RegistryEntityIdx'
  //   ]);
  //   expect(storageRef.getEntityRef('*Idx').map((x: any) => x.name)).to.be.deep.eq([
  //     'TestEntityIdx',
  //     'RegistryEntityIdx'
  //   ]);
  //   expect(storageRef.getEntityRef('*_idx').map((x: any) => x.name)).to.be.deep.eq([
  //     'TestEntityIdx',
  //     'RegistryEntityIdx'
  //   ]);
  //   expect(storageRef.getEntityRef('TestEn*').name).to.be.deep.eq(
  //     'TestEntityIdx'
  //   );
  //   expect(storageRef.getEntityRef('TesterEntity')).to.be.null;
  //   expect(storageRef.getEntityRef('TesterEntityIdx')).to.be.null;
  //   expect(storageRef.getEntityRef('*Entity')).to.be.null;
  //   expect(storageRef.getEntityRef('TestEntityIdx,RegistryEntityIdx').map((x: any) => x.name)).to.be.deep.eq([
  //     'TestEntityIdx',
  //     'RegistryEntityIdx'
  //   ]);
  //   expect(storageRef.getEntityRef('Test*Idx,Registry*Idx').map((x: any) => x.name)).to.be.deep.eq([
  //     'TestEntityIdx',
  //     'RegistryEntityIdx'
  //   ]);
  //   expect(storageRef.getEntityRef('TestT*Idx,RegistryP*Idx')).to.be.null;
  //   expect(storageRef.getEntityRef('Test*Idx,RegistryP*Idx').name).to.be.eq('TestEntityIdx');
  //
  // }
  //
  // @test
  // async 'check if worker is not active'() {
  //   await beforeCall(testConfig[3]);
  //   const status = Injector.get(IndexRuntimeStatus);
  //   expect(status.isWorkerActive()).to.be.false;
  // }
  //
  // @test
  // async 'check if worker is active'() {
  //   await beforeCall(testConfig[4]);
  //   const status = Injector.get(IndexRuntimeStatus);
  //   expect(status.isWorkerActive()).to.be.true;
  // }
  //
  // /**
  //  * For building/passing the correct query/fields we need the field types of the mapping
  //  *
  //  * Test if filtering for types:
  //  * - date
  //  * - float
  //  * - boolean
  //  * - text
  //  * - long
  //  *
  //  * source for this detection is ElasticStorageRef.prepare method
  //  *
  //  * for primative types in our modell we must generate the correct mapping
  //  *
  //  *
  //  */
  // @test.pending
  // async 'TODO: check initialized fields for difference types output'() {
  // }
  //

}
