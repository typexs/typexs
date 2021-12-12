import { AbstractUserSignup } from './AbstractUserSignup';
import { EqualWith } from '@typexs/ng/lib/validators/EqualWith';
import { Entity } from '@typexs/entity/libs/decorators/Entity';
import { Property } from '@typexs/entity/libs/decorators/Property';
import { ALLOWED_USER_PASSWORD_REGEX } from '../Constants';
import { Type } from '@typexs/ng/lib/forms/decorators/Type';
import { Text } from '@typexs/ng/lib/forms/decorators/Text';
import { IsEmail, MaxLength, MinLength, Regex } from '@allgemein/schema-api';
import { K_STORABLE } from '@typexs/entity/libs/Constants';

@Entity(<any>{ [K_STORABLE]: false })
export class DefaultUserSignup extends AbstractUserSignup {


  @Text()
  @MinLength(8, { message: 'username is too short' })
  @MaxLength(32, { message: 'username is too long' })
  @Regex(ALLOWED_USER_PASSWORD_REGEX, { message: 'username contains wrong character' })
  @Property({ type: 'string' })
  username: string;


  @Type({ form: 'password' })
  @MinLength(8, { message: 'password is too short' })
  @MaxLength(64, { message: 'password is a little too long' })
  // @AllowedString(ALLOWED_USER_PASSWORD_REGEX, {message: 'password contains wrong character'})
  @Property({ type: 'string' })
  password: string;


  // HTML Type password confirmation
  @Type({ form: 'password' })
  @Property({ type: 'string' })
  @EqualWith('password', { message: 'password is not equal' })
  passwordConfirm: string;


  @Type({ form: 'email' })
  // HTML5 Type email with additional help text
  @Property(<any>{ type: 'string', help: 'We\'ll never share your email with anyone else.' })
  @IsEmail()
  mail: string;


  resetSecret() {
    this.password = null;
    this.passwordConfirm = null;
  }


  getIdentifier() {
    return this.username;
  }

  getSecret() {
    return this.password;
  }

  getMail() {
    return this.mail;
  }
}
