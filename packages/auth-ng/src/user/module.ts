import { NgModule } from '@angular/core';
import { UserProfileComponent } from './components/profile/user_profile.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { UserSignupComponent } from './components/signup/user_signup.component';
import { UserLoginComponent } from './components/login/user_login.component';
import { UserLogoutComponent } from './components/logout/user_logout.component';
import { FormsModule as NgFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthTokenInterceptor } from './authtoken.interceptor';
import { AuthGuardService, AuthService, BaseModule } from '@typexs/base-ng';
import { UserAuthGuardService } from './user-auth-guard.service';
import { APP_ROUTES } from './routes';
import { UserAuthService } from './user-auth.service';
import { FormsModule } from '@typexs/forms-ng';
import { RouterMenuModule } from '@typexs/ng-router-menu';

const PROVIDERS = [
  {
    provide: AuthService,
    useClass: UserAuthService
  },
  {
    provide: AuthGuardService,
    useClass: UserAuthGuardService
  },
  {
    provide: HTTP_INTERCEPTORS,
    useClass: AuthTokenInterceptor,
    multi: true
  }
];

@NgModule({
  declarations: [
    UserProfileComponent,
    UserSignupComponent,
    UserLoginComponent,
    UserLogoutComponent
  ],
  imports: [
    CommonModule,
    NgFormsModule,
    FormsModule,
    BaseModule,
    RouterMenuModule
  ],
  exports: [
    UserProfileComponent,
    UserSignupComponent,
    UserLoginComponent,
    UserLogoutComponent
  ],
  providers: PROVIDERS
})
export class UserModule {


  static getRoutes() {
    return APP_ROUTES;
  }

  static forRoot() {
    return {
      ngModule: UserModule,
      providers: PROVIDERS
    };
  }

  constructor(private authService: AuthService) {
  }


}
