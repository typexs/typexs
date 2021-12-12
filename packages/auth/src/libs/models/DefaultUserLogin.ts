import { AbstractUserLogin } from './AbstractUserLogin';
import { Entity } from '@typexs/entity/libs/decorators/Entity';
import { Property } from '@typexs/entity/libs/decorators/Property';
import { ALLOWED_USER_PASSWORD_REGEX } from '../Constants';
import { Type } from '@typexs/ng/lib/forms/decorators/Type';
import { Text } from '@typexs/ng/lib/forms/decorators/Text';
import { K_STORABLE } from '@typexs/entity/libs/Constants';
import { MinLength, Regex } from '@allgemein/schema-api';

@Entity(<any>{ [K_STORABLE]: false })
export class DefaultUserLogin extends AbstractUserLogin {

  @Text()
  @Property({ type: 'string' })
  @MinLength(3, { message: 'Username should be longer then 4 chars' })
  @Regex(ALLOWED_USER_PASSWORD_REGEX, { message: 'username contains wrong character' })
  username: string;

  @Type({ form: 'password' })
  @Property({ type: 'string' })
  @MinLength(3, { message: 'Password should be longer then 4 chars' })
  password: string;


  resetSecret() {
    this.password = null;
  }

  getIdentifier() {
    return this.username;
  }

  getSecret() {
    return this.password;
  }
}
