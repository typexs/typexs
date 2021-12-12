import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '@typexs/auth/entities/User';
import { UserAuthService } from './../../user-auth.service';
import { AuthService } from '@typexs/base-ng';
import { mergeMap } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { of } from 'rxjs/internal/observable/of';
import { isNull } from 'lodash';


@Component({
  selector: 'txs-user-profile',
  templateUrl: './user_profile.components.html'
})
export class UserProfileComponent implements OnInit, OnDestroy {

  user: User;

  private subscription: Subscription;

  constructor(private authService: AuthService, private router: Router) {
  }


  getUserAuthService(): UserAuthService {
    return this.authService instanceof UserAuthService ? <UserAuthService>this.authService : <any>this.authService;
  }

  async ngOnInit() {
    this.subscription = this.getUserAuthService().isInitialized()
      .pipe(mergeMap(x => this.getUserAuthService().isLoggedIn()))
      .pipe(mergeMap(x => x ? this.getUserAuthService().getUser() : of(null)))
      .subscribe(x => {
        this.user = x;
        if (isNull(x)) {
          this.router.navigateByUrl('/');
        }
      });
  }


  isAuthenticated() {
    return this.user && this.getUserAuthService().isLoggedIn();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

}
