import {ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';
import {IUser} from '@typexs/ng';
import {Observable} from 'rxjs';
import {MessageChannel} from '../../messages/MessageChannel';
import {AuthMessage} from '../../messages/types/AuthMessage';


export interface IAuthServiceProvider {

  init(): void;

  /**
   * Returns if the service is online or if auth is not used and the default 'NoopAuthService' will be used
   *
   * - false for no auth check
   */
  isEnabled(): boolean;

  /**
   * Returns true if the service is fully initialized
   */
  isInitialized(): Observable<boolean>;


  getChannel(): MessageChannel<AuthMessage>;

  isLoggedIn(): Observable<boolean>;

  hasRoutePermissions(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean>;

  hasPermission(right: string, params?: any): Observable<boolean>;

  hasPermissionsFor?(object: any): Observable<boolean>;

  getUser(): Observable<IUser>;

  getRoles?(): Observable<string[]>;

  hasRole?(role: string): Observable<boolean>;

  getPermissions?(): Observable<string[]>;

}

