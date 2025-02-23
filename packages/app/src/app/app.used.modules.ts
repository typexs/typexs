import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { ModuleWithProviders, Type } from '@angular/core';
import { BaseModule } from '@typexs/base-ng';
import { FormsModule as NgFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AgGridModule } from 'ag-grid-angular';

import { APP_ROUTES } from './routes';

import { AdminModule } from '@typexs/ng-admin-ui';
import { RouterMenuModule } from '@typexs/ng-router-menu';
import { FormsModule } from '@typexs/forms-ng';
import { BaseAdminThemeModule } from '@typexs/ng-theme-base';
import { StorageModule } from '@typexs/storage-ng';
import { EntityModule } from '@typexs/entity-ng';
import { DistributedStorageModule } from '@typexs/distributed-storage-ng';
import { SearchModule } from '@typexs/search-ng';
import { CommonModule } from '@angular/common';


export const APP_MODULES: Array<Type<any> | ModuleWithProviders<any> | any[]> = [
  BrowserModule,
  CommonModule,
  HttpClientModule,
  BaseModule.forRoot(),
  NgFormsModule,
  RouterMenuModule,
  AdminModule,
  FormsModule.forRoot(),
  BaseAdminThemeModule,
  AgGridModule,
  RouterModule.forRoot(APP_ROUTES),
  StorageModule,
  EntityModule,
  DistributedStorageModule,
  SearchModule
];
