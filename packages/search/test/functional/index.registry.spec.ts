import { suite, test, timeout } from '@testdeck/mocha';
import { REGISTRY_TYPEORM, TypeOrmEntityRegistry } from '@typexs/base';
import { RegistryEntity } from './fake_app/entities/RegistryEntity';
import { getMetadataArgsStorage } from 'typeorm';
import { IndexEntityRef } from '../../src/lib/registry/IndexEntityRef';
import { expect } from 'chai';
import { RegistryFactory } from '@allgemein/schema-api';

let registry: any;

@suite('functional/index-registry') @timeout(300000)
class IndexRegistrySpec {


  static before() {
    RegistryFactory.remove(REGISTRY_TYPEORM);
    RegistryFactory.register(REGISTRY_TYPEORM, TypeOrmEntityRegistry);
    RegistryFactory.register(/^typeorm\..*/, TypeOrmEntityRegistry);
    registry = RegistryFactory.get(REGISTRY_TYPEORM);

  }

  @test
  async 'create ref for existing object to index'() {
    const tableDef = getMetadataArgsStorage().tables.find(x => x.target === RegistryEntity);
    const r = registry.createEntity(tableDef);
    const indexRef = new IndexEntityRef(r);

    expect(indexRef.getIndexName()).to.be.eq('typeorm_default_registry_entity');
    expect(indexRef.getTypeName()).to.be.eq('registry_entity');

    const props = indexRef.getPropertyRefs();
    expect(props).to.have.length(2);
    expect(props.map(p => p.name)).to.be.deep.eq(['id', 'name']);

    // const json = indexRef.toJsonTree();
    // console.log(json);
  }

  @test.pending
  async 'TODO register of @typexs/schema stuff'() {
  }

  @test.pending
  async 'TODO register of stuff from other registries'() {
  }

}
