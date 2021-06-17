import {IAuthServiceProvider} from './IAuthServiceProvider';
import {Injectable} from '@angular/core';
import {NoopAuthService} from './noop-auth.service';

@Injectable()
export class AuthService extends NoopAuthService implements IAuthServiceProvider {


}
