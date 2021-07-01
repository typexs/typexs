import {suite, test, timeout} from '@testdeck/mocha';
import {TypeOrmEntityRegistry} from '@typexs/base';
import {RegistryEntity} from './fake_app/entities/RegistryEntity';
import {getMetadataArgsStorage} from 'typeorm';
import {IndexEntityRef} from '../../src/lib/registry/IndexEntityRef';
import {expect} from 'chai';


@suite('functional/typexs-search/registry') @timeout(300000)
class TypexsSearchIndexRegistry {


  static async before() {

  }

  @test
  async 'create ref for existing object to index'() {
    const tableDef = getMetadataArgsStorage().tables.find(x => x.target === RegistryEntity);
    const r = TypeOrmEntityRegistry.$().createEntity(<any>tableDef);
    const indexRef = new IndexEntityRef(r);

    expect(indexRef.getIndexName()).to.be.eq('typeorm_default_registry_entity');
    expect(indexRef.getTypeName()).to.be.eq('registry_entity');

    const props = indexRef.getPropertyRefs();
    expect(props).to.have.length(2);
    expect(props.map(p => p.name)).to.be.deep.eq(['id', 'name']);

    // const json = indexRef.toJsonTree();
    // console.log(json);
  }


}
