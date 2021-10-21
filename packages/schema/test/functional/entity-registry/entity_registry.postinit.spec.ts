import '../../../src/libs/decorators/register';
import { expect } from 'chai';
import { suite, test } from '@testdeck/mocha';
import { RegistryFactory } from '@allgemein/schema-api';
import { NAMESPACE_BUILT_ENTITY } from '../../../src/libs/Constants';
import { EntityRegistry } from '../../../src/libs/EntityRegistry';
import { Places } from './entities/Places';

let registry: EntityRegistry;

@suite('functional/entity_registry_postinit')
class EntityRegistrySpec {


  static before() {
    RegistryFactory.remove(NAMESPACE_BUILT_ENTITY);
  }


  static after() {
    RegistryFactory.reset();
  }


  @test
  async 'checked if unannotated property are ignored'() {
    const Places = require('./entities/Places').Places;
    registry = RegistryFactory.get(NAMESPACE_BUILT_ENTITY);
    const entityRef = registry.getEntityRefFor(Places);
    const props = entityRef.getPropertyRefs();
    expect(props).to.have.length(3);
  }

}

