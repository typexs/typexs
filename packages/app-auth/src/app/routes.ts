import { Routes } from '@angular/router';
import { DemosComponent } from './demos/demos.component';
import { AuthGuardService, CTXT_ROUTE_USER_LOGOUT, CTXT_ROUTE_USER_PROFILE } from '@typexs/base-ng';
import { BatAuthLoginComponent } from './demos/bat-auth-login/bat-auth-login.component';
import { BatAuthSignupComponent } from './demos/bat-auth-signup/bat-auth-signup.component';
import { BatAuthProfileComponent } from './demos/bat-auth-profile/bat-auth-profile.component';
import { PERM_ALLOW_ACCESS_USER_LIST } from './lib/Constants';
import { UsersListComponent } from './demos/bat-auth-users-list/users-list.component';
import { UserLogoutComponent } from '@typexs/auth-ng';
import { AdminComponent } from '@typexs/ng-admin-ui';
import { TasksModule } from '@typexs/tasks-ng';
import { StorageModule } from '@typexs/storage-ng';
import { EntityModule } from '@typexs/entity-ng';
import { DistributedStorageModule } from '@typexs/distributed-storage-ng';


export const APP_ROUTES: Routes = [
  {
    path: 'demo',
    component: DemosComponent,
    data: { label: 'Demo' },
    children: [
      {
        path: 'user/signup',
        component: BatAuthSignupComponent,
        canActivate: [AuthGuardService],
        data: {
          label: 'Signup', isAuthenticated: false, anonymView: 'hide'
        }
      },
      {
        path: 'user/login',
        component: BatAuthLoginComponent,
        canActivate: [AuthGuardService],
        data: { label: 'Login', isAuthenticated: false, anonymView: 'disable' }
      },
      {
        path: 'user/profile',
        component: BatAuthProfileComponent,
        canActivate: [AuthGuardService],
        data: {
          label: 'Profile',
          isAuthenticated: true,
          context: CTXT_ROUTE_USER_PROFILE,
          anonymView: 'hide'
        }
      },
      {
        path: 'users',
        component: UsersListComponent,
        canActivate: [AuthGuardService],
        data: {
          label: 'Users list',
          permissions: [PERM_ALLOW_ACCESS_USER_LIST],
          anonymView: 'hide'
        }
      },
      {
        path: 'user/logout',
        component: UserLogoutComponent,
        canActivate: [AuthGuardService],
        data: {
          label: 'Logout',
          isAuthenticated: true,
          context: CTXT_ROUTE_USER_LOGOUT,
          anonymView: 'disable'
        }
      }
    ]
  },
  {
    path: 'admin', component: AdminComponent,
    canActivate: [AuthGuardService],
    data: { label: 'Admin', group: 'admin' },
    children: [
      ...TasksModule.getRoutes(),
      ...StorageModule.getRoutes(),
      ...EntityModule.getRoutes(),
      ...DistributedStorageModule.getRoutes()
    ]
  },
  {
    path: '', redirectTo: 'demo', pathMatch: 'full'
  },
  {
    path: '**', redirectTo: 'demo'
  }

];





