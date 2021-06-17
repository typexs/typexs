import {suite, test} from '@testdeck/mocha';

import {MaxLength, MinLength} from 'class-validator';
import {inspect} from 'util';
import {Log} from '@typexs/base';
import {Entity, EntityRegistry, Property} from '@typexs/schema';
import {Form, FORM_ELEMENTS} from '../../../src/lib/forms/elements';
import {FormBuilder} from '../../../src/lib/forms/FormBuilder';
import {ComponentRegistry, Text, Type} from '../../../src';

FORM_ELEMENTS;



@Entity()
export class TestUser {

  @Text()
  @Property({type: 'string'})
  @MinLength(8, {message: 'username is too short'})
  @MaxLength(32, {message: 'username is too long'})
  username: string = '';

  @Type({form: 'password'})
  @Property({type: 'string'})
  @MinLength(8, {message: 'password is too short'})
  @MaxLength(64, {message: 'password is a little too long'})
  password: string = '';


}




@suite('functional/forms/form_parse')
class FormParseSpec {

  /*
  before() {
    Bootstrap.reset();

  }

  after() {
    Bootstrap.reset();
  }
*/

  @test.skip()
  async 'parse json form'() {

    const formJSON: any = {
      name: 'test-form',
      type: 'form',
      styles: ['form-container'],

      children: [{
        type: 'tabs',
        children: [
          {
            type: 'tab',
            children: [{
              type: 'ref',
              use: 'username'
            }]
          },
          {
            type: 'tab',
            label: '$password.label',
            children: [{
              type: 'ref',
              use: 'password',
              label: 'PW' // overriding
            }]
          }]
      }],
    };


    const entities = EntityRegistry.$().getSchemaRefByName('default').getEntityRefs();


    const builder1 = new FormBuilder(ComponentRegistry.$());
    const form = builder1.buildFromJSON(formJSON);
    // console.log(form);



    const entityDef = EntityRegistry.$().getEntityRefFor('TestUser');

    const builder2 = new FormBuilder(ComponentRegistry.$());
    const form2 = builder2.buildFromEntity(entityDef);


    // todo let form2JSON = form2.toJSON();
    // Log.info(inspect(form2,null,10));

    const form3 = (<Form>form).combine(form2);
    Log.info(inspect(form3, null, 10));

  }

  @test.skip()
  async 'parse json form over template'() {


    // Idee für den test
    const formJSONTemplate: any = {
      tpls: [
        {
          $match: {type: 'form'},
          $do: {
            children: [{
              type: 'tabs',
              children: [{
                $each: {$select: '$.children'},
                $do: {
                  type: 'tab',
                  label: '$.label',
                  children: [{$apply: '.', label: 'TEST'}] // override label variant 1
                }
              }]
            }]
          }
        },
        {
          $match: {'type': 'input'},
          $do: [
            {$value: '.'},
            {label: 'Test'}// override label variant 2
          ],
        }
      ],
    };
  }
}

