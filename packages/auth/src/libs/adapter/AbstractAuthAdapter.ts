import { IAuthAdapter } from './IAuthAdapter';
import { AuthLifeCycle } from '../Constants';
import { DefaultUserLogin } from '../models/DefaultUserLogin';
import { DefaultUserSignup } from '../models/DefaultUserSignup';
import { IAuthOptions } from '../auth/IAuthOptions';
import { DefaultUserLogout } from '../models/DefaultUserLogout';
import { AuthDataContainer } from '../auth/AuthDataContainer';
import { AbstractUserLogin } from '../models/AbstractUserLogin';
import { defaultsDeep, get, isFunction } from '@typexs/generic';


const DEFAULT_AUTH_OPTIONS: IAuthOptions = {
  type: 'none',
  role: null,
  approval: {
    auto: true,
    notify: []
  },
};

export abstract class AbstractAuthAdapter implements IAuthAdapter {


  type: string = null;

  authId: string = null;

  options: IAuthOptions;


  prepare(authOptions: IAuthOptions): void {
    this.options = authOptions;
    defaultsDeep(this.options, DEFAULT_AUTH_OPTIONS);
  }


  abstract authenticate(login: AuthDataContainer<AbstractUserLogin>): Promise<boolean> | boolean;


  canAutoApprove(): boolean {
    return this.options.approval.auto;
  }

  getDefaultRole(): string {
    return this.options.role;
  }

  getOptions(): IAuthOptions {
    return this.options;
  }

  /*
    extend(obj: User | AuthMethod, data: any): void {
    }
  */

  canCreateOnLogin(): boolean {
    return get(this.options, 'createOnLogin', false) && isFunction(this['createOnLogin']);
  }


  canSignup(): boolean {
    const res = get(this.options, 'allowSignup', false) && isFunction(this['signup']);
    return res;
  }


  getModelFor(lifecycle: AuthLifeCycle): Function {
    switch (lifecycle) {
      case 'login':
        return DefaultUserLogin;
      case 'signup':
        return DefaultUserSignup;
      case 'logout':
        return DefaultUserLogout;
    }
    throw new Error('No model for lifecycle ' + lifecycle + ' in ' + this.authId);
  }

}
