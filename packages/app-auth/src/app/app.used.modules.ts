import { APP_ROUTES } from './routes';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { ModuleWithProviders, Type } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@typexs/forms-ng';
import { AdminModule } from '@typexs/ng-admin-ui';
import { BaseModule } from '@typexs/base-ng';
import { BaseAdminThemeModule } from '@typexs/ng-theme-base';
import { StorageModule } from '@typexs/storage-ng';
import { EntityModule } from '@typexs/entity-ng';
import { RouterMenuModule } from '@typexs/ng-router-menu';
import { UserAdminModule, UserModule } from '@typexs/auth-ng';


export const APP_MODULES: Array<Type<any> | ModuleWithProviders<any> | any[]> = [
  BrowserModule,
  HttpClientModule,
  RouterMenuModule,
  FormsModule,
  RouterModule.forRoot(APP_ROUTES),
  AdminModule,
  BaseModule.forRoot(),
  BaseAdminThemeModule,
  StorageModule,
  EntityModule,
  UserModule.forRoot(),
  UserAdminModule

];
