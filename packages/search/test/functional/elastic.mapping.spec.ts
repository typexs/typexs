import { RegistryFactory } from '@allgemein/schema-api';
import { suite, test } from '@testdeck/mocha';
import { C_SEARCH_INDEX } from '../../src/lib/Constants';
import { Bootstrap } from '@typexs/base';
import { NAMESPACE_BUILT_ENTITY } from '@typexs/entity';
import { IndexEntityRegistry } from '../../src/lib/registry/IndexEntityRegistry';
import { EntityWithElasticTypes } from './scenarios/app_with_mapping/entities/EntityWithElasticTypes';
import { ElasticUtils } from '../../src/lib/elastic/ElasticUtils';
import { expect } from 'chai';
import { EntityWithReference } from './scenarios/app_with_mapping/entities/EntityWithReference';
import { X, Y } from './helper/Constants.mapping';

@suite('functional/elastic/mapping')
class TypexsSearchElasticMappingSpec {

  static before() {
    RegistryFactory.register(C_SEARCH_INDEX, IndexEntityRegistry);
    RegistryFactory.register(/^search-index\..*/, IndexEntityRegistry);
  }

  before() {
    Bootstrap.reset();
  }


  @test
  async 'elastic mapping definition generation for primative types'() {
    const classRef = RegistryFactory.get(NAMESPACE_BUILT_ENTITY).getEntityRefFor(EntityWithElasticTypes);
    const ref = IndexEntityRegistry.$()._create(classRef, 'gen-index', { allowAutoAppendAllField: false });
    const mapping = ElasticUtils.buildMappingPropertiesTree(ref);
    expect(mapping).to.be.deep.eq(X);
  }


  @test
  async 'elastic mapping definition generation for reference'() {
    const classRef = RegistryFactory.get(NAMESPACE_BUILT_ENTITY).getEntityRefFor(EntityWithReference);
    const ref = IndexEntityRegistry.$()._create(classRef, 'gen-index', { allowAutoAppendAllField: false });
    const mapping = ElasticUtils.buildMappingPropertiesTree(ref);
    expect(mapping).to.be.deep.eq(Y);
  }


}

