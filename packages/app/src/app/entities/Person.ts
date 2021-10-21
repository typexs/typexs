import {Entity} from '@typexs/schema/libs/decorators/Entity';
import {Property} from '@typexs/schema/libs/decorators/Property';
import {Readonly, Text} from '@typexs/ng';
import {IsNotEmpty} from '@allgemein/schema-api';

@Entity()
export class Person {

  @Readonly()
  @Property({type: 'number', auto: true})
  id: number;

  @Text()
  @IsNotEmpty()
  @Property({type: 'string'})
  firstName: string;

  @Text()
  @IsNotEmpty()
  @Property({type: 'string'})
  lastName: string;

  label() {
    return this.lastName + ', ' + this.firstName;
  }
}
