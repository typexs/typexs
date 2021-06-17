import {EqualWith, Text, Type} from '@typexs/ng';
import {Property} from '@typexs/schema/libs/decorators/Property';
import {Entity} from '@typexs/schema/libs/decorators/Entity';
import {IsEmail, MaxLength, MinLength} from '@allgemein/schema-api';
import {OptionsService} from '../services/OptionsService';


@Entity({storable: false})
export class InputDemoObject {

  // HTML Type text
  @Text()
  @Property({type: 'string'})
  @MinLength(8, {message: 'username is too short'})
  @MaxLength(32, {message: 'username is too long'})
  username = 'Test';

  // HTML Type password
  @Type({form: 'password'})
  @Property({type: 'string'})
  @MinLength(8, {message: 'password is too short'})
  @MaxLength(64, {message: 'password is a little too long'})
  password: string;

  // HTML Type password confirmation
  @Type({form: 'password'})
  @Property({type: 'string'})
  @EqualWith('password', {message: 'password is not equal'})
  passwordConfirm: string;

  // HTML5 Type email with additional help text
  @Property(<any>{type: 'string', form: 'email', help: 'We\'ll never share your email with anyone else.'})
  @IsEmail()
  email: string;

  // HTML Type text and readonly
  @Property(<any>{type: 'string', form: 'text', readonly: true})
  street: string;

  // HTML Type checkbox
  @Property(<any>{type: 'boolean', form: 'checkbox'})
  allowAccess: boolean;

  // HTML Type checkbox
  @Property(<any>{type: 'boolean', form: 'checkbox', label: 'Allow no access'})
  allowNoAccess = true;

  // HTML Type radio
  @Property(<any>{type: 'boolean', form: 'radio', label: 'Use radio'})
  useRadio: boolean;


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
    form: 'select',
    label: 'Favored music',
    enum: 'favoredMusicTypes'
  })
  favoredMusic: string;

  favoredMusicTypes: any[] = [
    {'label': 'Rock', 'value': 'rock'},
    {'label': 'Punk', 'value': 'punk'},
    {'label': 'Pop', 'value': 'pop'},
    {'label': 'Classic', 'value': 'classic'}
  ];

  // Reference to service
  // TODO analyse observable
  @Property(<any>{
    type: 'string',
    form: 'select',
    label: 'Favored music from service',
    enum: OptionsService
  })
  favoredMusicService: string;


  // TODO grouping, alignment (inline, top)
  //
  @Property(<any>{
    type: 'string',
    cardinality: 0,
    form: 'select',
    label: 'Favored music',
    enum: 'favoredMusicTypes'
  })
  favoredMusicMulti: string[];


}
