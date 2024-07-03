import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule as NgFormsModule } from '@angular/forms';
import { AppService, BaseModule } from '@typexs/base-ng';
import { FormsModule } from '@typexs/forms-ng';
import { StorageService } from './storage.service';
import { StorageTypesComponent } from './types/storage-types.component';
import { StorageStructComponent } from './struct/storage-struct.component';
import { StorageModifyComponent } from './modify/storage-modify.component';
import { StorageViewComponent } from './view/storage-view.component';
import { StorageQueryComponent } from './query/page/storage-query.component';
import { StorageDeleteComponent } from './delete/storage-delete.component';
import { StorageBackendsComponent } from './backends/storage-backends.component';
import { StorageQueryEmbeddedComponent } from './query/embedded/storage-query-embedded.component';
import { STORAGE_ROUTES } from './routes';
import { StorageAggregateComponent } from './aggregate/page/storage-aggregate.component';
import { StorageAggregateEmbeddedComponent } from './aggregate/embedded/storage-aggregate-embedded.component';

const PROVIDERS = [
  StorageService
];

const COMPONENTS = [
  StorageTypesComponent,
  StorageStructComponent,
  StorageModifyComponent,
  StorageViewComponent,
  StorageQueryComponent,
  StorageQueryEmbeddedComponent,
  StorageDeleteComponent,
  StorageBackendsComponent,
  StorageAggregateComponent,
  StorageAggregateEmbeddedComponent,
  // SystemStoragesComponent
];

@NgModule({
  declarations: COMPONENTS,
  imports: [
    CommonModule,
    BaseModule,
    RouterModule,
    NgFormsModule,
    FormsModule
  ],
  exports: COMPONENTS,
  providers: PROVIDERS,
  // schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class StorageModule {

  static forRoot() {
    return {
      ngModule: StorageModule,
      providers: PROVIDERS
    };
  }

  static getRoutes(prefix?: string) {
    return STORAGE_ROUTES;
  }

  // static getLazyRoutes(prefix?: string) {
  //   return LAZY_STORAGE_ROUTES;
  // }

  constructor(private appService: AppService) {
    // this.appService.registerService('StorageService', StorageService);
    // RegistryFactory.register(REGISTRY_TYPEORM, TypeOrmEntityRegistry);
    // RegistryFactory.register(/^typeorm\..*/, TypeOrmEntityRegistry);
  }

}
