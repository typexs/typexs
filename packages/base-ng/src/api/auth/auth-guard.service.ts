import {Injectable} from '@angular/core';
import {DefaultAuthGuardService} from './default-auth-guard.service';
import {IAuthGuardProvider} from './IAuthGuardProvider';


@Injectable()
export class AuthGuardService extends DefaultAuthGuardService implements IAuthGuardProvider {


}
