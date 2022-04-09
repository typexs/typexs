import { suite, test } from '@testdeck/mocha';
import * as _ from 'lodash';
import { expect } from 'chai';
import { FORM_ELEMENTS } from '../../src/elements';
import { FormBuilder } from '../../src/lib/FormBuilder';
import { RegistryFactory } from '@allgemein/schema-api';
import { ComponentRegistry } from '@typexs/base';
import { CheckboxMatrixRow } from './entities/CheckboxMatrixRow';
import { CheckboxMatrix } from './entities/CheckboxMatrix';
FORM_ELEMENTS;


@suite('functional/forms/form_checkbox_matrix')
class FormParseSpec {

  /*
  before() {
    Bootstrap.reset();

  }

  after() {
    Bootstrap.reset();
  }
*/

  @test
  async 'build'() {

    const checkboxMatrix = new CheckboxMatrix();
    checkboxMatrix.rows = [];

    const row = new CheckboxMatrixRow();
    row.label = 'allow all';
    checkboxMatrix.rows.push(row);

    const row2 = new CheckboxMatrixRow();
    row2.label = 'deny all';
    checkboxMatrix.rows.push(row2);

    const registry = RegistryFactory.get();
    const entityRef = registry.getEntityRefFor(CheckboxMatrix);
    expect(entityRef.getPropertyRefs()).to.have.length(1);
    const formBuilder = new FormBuilder(ComponentRegistry.$(), {onlyDecoratedFields: false});
    const formElements = formBuilder.buildFromEntity(entityRef);
    const children = formElements.getChildren();
    expect(children).to.have.length(1);
    const gridChildren = formElements.getChildren()[0].getChildren();
    expect(gridChildren).to.have.length(2);
    const checkbox = _.get(formElements, 'children.0.children.1');
    expect(checkbox.isMultiple()).to.be.true;
    expect(checkbox.isReplicable()).to.be.true;
    // console.log(inspect(formElements,false,10))

  }
}

