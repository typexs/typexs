import {get, set} from 'lodash';
import {Injectable} from '@angular/core';
import {NavigationCancel, NavigationEnd, NavigationError, Router} from '@angular/router';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {AuthService} from './../api/auth/auth.service';
import {MessageService} from './../messages/message.service';
import {AuthMessage} from './../messages/types/AuthMessage';
import {C_ADMIN, CTXT_VIEW_ADMIN, CTXT_VIEW_DEFAULT, CTXT_VIEW_LOADING, CTXT_VIEW_LOGIN} from './../constants';
import {switchMap} from 'rxjs/operators';
import {Log} from './../lib/log/Log';
import {BackendService} from '../api/backend/backend.service';

/**
 * The service is used for app status informations and distribution of this information on the front end.
 *
 * - backend check if exists
 * - loading status
 *
 */
@Injectable()
export class AppService {

  _isAdmin: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  _viewMode: BehaviorSubject<string> = new BehaviorSubject<string>(CTXT_VIEW_LOADING);

  adminUrl = false;

  settings: any = {};

  serviceClasses: { [name: string]: Function } = {};

  registerService(name: string, fn: Function) {
    this.serviceClasses[name] = fn;
  }

  getService(name: string) {
    if (this.serviceClasses[name]) {
      return this.serviceClasses[name];
    }
    return null;
  }

  constructor(
    private backendService: BackendService,
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {

    authService.getChannel().subscribe(this.onMessage.bind(this));
    router.events.subscribe(e => {

      if (e instanceof NavigationEnd) {
        this.adminUrl = e.urlAfterRedirects.startsWith('/' + C_ADMIN);
        if (this._isAdmin.value && this.adminUrl) {
          if (!this.isViewContext(CTXT_VIEW_ADMIN)) {
            this.setViewContext(CTXT_VIEW_ADMIN);
          }
        }
        if (this.isViewContext(CTXT_VIEW_ADMIN) && !this.adminUrl) {
          this.setViewContext(CTXT_VIEW_DEFAULT);
        }
      } else if (e instanceof NavigationCancel) {
        Log.debug('canceled ...');
      } else if (e instanceof NavigationError) {
        Log.debug('error ...');
      }
    });
  }

  getSettings(path: string, _default?: any) {
    return get(this.settings, path, _default);
  }

  setSettings(path: string, value: any) {
    return set(this.settings, path, value);
  }

  getAuthService() {
    return this.authService;
  }


  getBackendClient() {
    return this.backendService;
  }


  getViewContext() {
    return this._viewMode.asObservable();
  }


  getViewContextValue() {
    return this._viewMode.value;
  }


  setViewContext(str: string) {
    this._viewMode.next(str);
  }


  isViewContext(str: string) {
    return this.getViewContextValue() === str;
  }


  getLogService() {
    return this.messageService.getLogService();
  }


  isAuthenticated() {
    return this.authService.isLoggedIn();
  }


  async onMessage(m: any) {
    if (m instanceof AuthMessage) {
      this.authService
        .isLoggedIn()
        .pipe(switchMap(logged => {
          if (logged) {
            return this.authService.hasRole(C_ADMIN);
          } else {
            this.setViewContext(CTXT_VIEW_LOGIN);
            return of(logged);
          }
        }))
        .subscribe(isAdmin => {
          this._isAdmin.next(isAdmin);
          if (isAdmin) {
            if (this.adminUrl && !this.isViewContext(CTXT_VIEW_ADMIN)) {
              this.setViewContext(CTXT_VIEW_ADMIN);
            } else {
              this.setViewContext(CTXT_VIEW_DEFAULT);
            }
          }
        });
    }
  }


  get isAdmin(): Observable<boolean> {
    return this._isAdmin.asObservable();
  }


}
