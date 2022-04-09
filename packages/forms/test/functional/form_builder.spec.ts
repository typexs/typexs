import { suite, test } from '@testdeck/mocha';
import { expect } from 'chai';
import { Entity, EntityRegistry, Property } from '@typexs/entity';
import { ComponentRegistry } from '@typexs/base/libs/bindings/ComponentRegistry';
import { FormBuilder } from '../../src/lib/FormBuilder';
import { FORM_ELEMENTS } from '../../src/elements';


FORM_ELEMENTS;


@Entity({ storeable: false })
export class TreeTestSub {

  @Property({ type: 'string' })
  name: string = '';


}


@Entity({ storeable: false })
export class TreeTestData {


  @Property({ type: 'string' })
  name: string = '';

  @Property({ type: TreeTestSub, cardinality: 0 })
  sub: TreeTestSub[];


}

@suite('functional/forms/form_builder')
class FormParseSpec {

  @test
  async 'tree data parse'() {

    const builder = new FormBuilder(ComponentRegistry.$(), {onlyDecoratedFields: false});
    const entityDef = EntityRegistry.$().getEntityRefFor('TreeTestData');
    const tree = builder.buildFromEntity(entityDef);
    expect(tree.children).to.have.length(2);
    expect(tree.children[0].type).to.be.eq('input');
    expect((<any>tree.children[0]).variant).to.be.eq('text');
    expect(tree.children[0].children).to.have.length(0);
    expect(tree.children[1].type).to.be.eq('select');
    expect((<any>tree.children[1]).variant).to.be.eq('select');
    expect(tree.children[1].children).to.have.length(0);
  }
}

