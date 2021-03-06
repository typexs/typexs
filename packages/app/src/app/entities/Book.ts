import { Entity } from '@typexs/entity/libs/decorators/Entity';
import { Property } from '@typexs/entity/libs/decorators/Property';
import { IProperty } from '@typexs/entity/libs/registry/IProperty';
import { Person } from './Person';
import { Readonly, Text } from '@typexs/forms';
import { EntityOptionsService } from '@typexs/entity-ng';

@Entity()
export class Book {

  @Readonly()
  @Property({ type: 'number', auto: true })
  id: number;

  @Text()
  @Property({ type: 'string' })
  title: string;

  @Property(<IProperty & any>{ type: Person, form: 'select', enum: EntityOptionsService.name })
  author: Person;

  label() {
    return this.title;
  }
}
