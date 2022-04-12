import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { USER_ADMIN_ROUTES } from './routes';
import { BaseModule } from '@typexs/base-ng';
import { PermissionsRolesComponent } from './components/permissions-roles/permissions-roles.component';
// import { UserModule } from '../user/module';
import { NavigatorService, RouterMenuModule } from '@typexs/ng-router-menu';
import { EntityModule } from '@typexs/entity-ng';
import { CommonModule } from '@angular/common';
import { BaseAdminThemeModule } from '@typexs/ng-theme-base';
import { FormsModule } from '@angular/forms';
import { FormsModule as NgFormModule } from '@typexs/forms-ng';

// export const PROVIDERS: any[] = [];

@NgModule({
  declarations: [
    PermissionsRolesComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(USER_ADMIN_ROUTES),
    BaseModule,
    // UserModule,
    RouterMenuModule,
    EntityModule,
    BaseAdminThemeModule,
    FormsModule,
    NgFormModule
  ],
  exports: [
    PermissionsRolesComponent
  ],
  // providers: PROVIDERS,
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class UserAdminModule {

  // static forRoot() {
  //   return {
  //     ngModule: UserAdminModule,
  //     providers: PROVIDERS
  //   };
  // }

  constructor(private navigator: NavigatorService) {
    this.navigator.addGroupEntry('admin/users/.*', { label: 'Users', group: 'admin' });
  }

}
