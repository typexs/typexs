import {Entity} from '@typexs/schema/libs/decorators/Entity';
import {Property} from '@typexs/schema/libs/decorators/Property';
import {IProperty} from '@typexs/schema/libs/registry/IProperty';
import {Person} from './Person';
import {Readonly} from '@typexs/ng';
import {Text} from '@typexs/ng';
import {EntityOptionsService} from '@typexs/entity-ng';

@Entity()
export class Book {

  @Readonly()
  @Property({type: 'number', auto: true})
  id: number;

  @Text()
  @Property({type: 'string'})
  title: string;

  @Property(<IProperty & any>{type: Person, form: 'select', enum: EntityOptionsService.name})
  author: Person;

  label() {
    return this.title;
  }
}
