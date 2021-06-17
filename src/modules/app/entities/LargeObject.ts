import {Readonly, Text, Type} from '@typexs/ng';
import {Property} from '@typexs/schema/libs/decorators/Property';
import {Entity} from '@typexs/schema/libs/decorators/Entity';
import {IsEmail} from 'class-validator';

@Entity()
export class LargeObject {


  // HTML Type text
  @Readonly()
  @Property({type: 'number', auto: true})
  id: number;

  // HTML Type text
  @Text()
  @Property({type: 'string'})
  username: string = 'Test';

  // HTML Type password
  @Type({form: 'password'})
  @Property({type: 'string'})
  nickname: string;

  // HTML5 Type email with additional help text
  @Property(<any>{type: 'string', form: 'email', help: 'We\'ll never share your email with anyone else.'})
  @IsEmail()
  email: string;

  // HTML Type text and readonly
  @Property(<any>{type: 'string'})
  street: string;


  /**
   * TODO: HTML5 types to implement

   color
   date
   datetime-local
   DONE: email
   month
   number
   range
   search
   tel
   time
   apiUrl
   week
   */

    // TODO multiple select!

    // HTML Type select
    // Enum or Service or ComplexEnum or Reference!
  @Property(<any>{type: 'string', form: 'select', label: 'Favored color', enum: ['Blue', 'Green', 'Red']})
  favoredColor: string;

  // HTML Type select
  // Option Enum
  @Property(<any>{
    type: 'string',
    form: 'select',
    label: 'Favored color 2',
    enum: [{value: 'blue1', label: 'Blue'}, {value: 'green2', label: 'Green'}, {value: 'red3', label: 'Red'}]
  })
  favoredColorCode: string;

  // Reference to proprety
  @Property(<any>{
    type: 'string',
    label: 'Favored music',
    enum: 'favoredMusicTypes'
  })
  favoredMusic: string;


  // Reference to service
  // TODO analyse observable
  @Property(<any>{
    type: 'string',
    label: 'Favored music from service'
  })
  favoredMusicService: string;


  @Property({type: 'string'})
  property01: string;

  @Property({type: 'string'})
  property02: string;

  @Property({type: 'string'})
  property03: string;

  @Property({type: 'string'})
  property04: string;

  @Property({type: 'string'})
  property05: string;

  @Property({type: 'string'})
  property06: string;

}
