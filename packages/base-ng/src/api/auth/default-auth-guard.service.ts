import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';
import {IAuthGuardProvider} from './IAuthGuardProvider';
import {AuthService} from './auth.service';
import {mergeMap} from 'rxjs/operators';
import {of} from 'rxjs';


@Injectable()
export class DefaultAuthGuardService implements IAuthGuardProvider {

  constructor(private authService: AuthService) {
  }


  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if (!this.authService.isEnabled()) {
      return of(true);
    }
    return this.authService.isInitialized()
      .pipe(mergeMap(x => x ? this.authService.isLoggedIn() : of(false)))
      .pipe(mergeMap(x => x ? this.authService.hasRoutePermissions(route, state) : of(false)));

  }
}
