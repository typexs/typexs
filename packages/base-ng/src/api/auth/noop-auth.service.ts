import {Injectable} from '@angular/core';
import {IAuthServiceProvider} from './IAuthServiceProvider';
import {ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';
import {MessageService} from '../../messages/message.service';
import {MessageChannel} from '../../messages/MessageChannel';
import {MessageType} from '../../messages/IMessage';
import {Observable, BehaviorSubject, of} from 'rxjs';
import {MESSAGE_TYPE_AUTH_SERVICE, MSG_TOPIC_AUTH_SET_USER} from '../../constants';
import {AuthMessage} from '../../messages/types/AuthMessage';
import {BackendService} from '../backend/backend.service';
import {AnonymusUser, IUser} from '@typexs/ng';

@Injectable()
export class NoopAuthService implements IAuthServiceProvider {

  user: IUser = new AnonymusUser();

  private _initialized: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  private _loggedIn: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);

  constructor(private messageService: MessageService, private backendClient: BackendService) {
  }

  init() {
    const msg = new AuthMessage();
    msg.type = MessageType.SUCCESS;
    msg.topic = MSG_TOPIC_AUTH_SET_USER;
    this.backendClient.reloadRoutes().subscribe(x => {
      this._initialized.next(true);
      this.getChannel().publish(msg);
    });

  }

  isInitialized(): Observable<boolean> {
    return this._initialized;
  }


  isEnabled(): boolean {
    return false;
  }

  getChannel(): MessageChannel<AuthMessage> {
    return <MessageChannel<AuthMessage>>this.messageService.get(MESSAGE_TYPE_AUTH_SERVICE);
  }

  isLoggedIn(): Observable<boolean> {
    return this._loggedIn;
  }

  getUser<T extends IUser>(): Observable<T> {
    return of(<T>this.user);
  }

  getPermissions(): Observable<string[]> {
    return of([]);
  }

  getRoles(): Observable<string[]> {
    return of([]);
  }

  hasRoutePermissions(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return of(true);
  }

  hasPermissionsFor(object: any): Observable<boolean> {
    return of(true);
  }

  hasPermission(right: string, params?: any): Observable<boolean> {
    return of(true);
  }

  hasRole(role: string): Observable<boolean> {
    return of(true);
  }
}

