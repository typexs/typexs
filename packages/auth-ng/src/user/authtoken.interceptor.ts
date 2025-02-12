import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

import { AuthService } from '@typexs/base-ng';
import { UserAuthService } from './user-auth.service';
import { isEmpty, isString } from '@typexs/generic';


@Injectable()
export class AuthTokenInterceptor implements HttpInterceptor {

  constructor(public auth: AuthService) {
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // @ts-ignore
    if (this.auth instanceof UserAuthService && this.auth.isEnabled()) {
      const provider = <UserAuthService>this.auth;
      const token = provider.getStoredToken();
      if (token && isString(token) && !isEmpty(token)) {
        const tokenKey = provider.getTokenKey();
        const setHeaders: any = {};
        setHeaders[tokenKey] = token;
        provider.setToken(token);
        request = request.clone({
          setHeaders: setHeaders
        });
      } else {
        provider.setToken(null);
      }
    }
    return next.handle(request);
  }
}
