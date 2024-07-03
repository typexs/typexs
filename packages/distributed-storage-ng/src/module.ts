import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule as NgFormsModule } from '@typexs/forms-ng';
import { AppService, BaseModule } from '@typexs/base-ng';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DISTRIBUTED_STORAGE_ROUTES } from './routes';
import { DistributedStorageService } from './services/distributed_storage.service';
import { DistributedStorageQueryEmbeddedComponent } from './components/query/embedded/query-embedded.component';
import { DistributedStorageQueryPageComponent } from './components/query/page/query-page.component';
import { FormsModule } from '@angular/forms';

const PROVIDERS = [
  DistributedStorageService,
];

const COMPONENTS: any[] = [
  DistributedStorageQueryEmbeddedComponent,
  DistributedStorageQueryPageComponent
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
export class DistributedStorageModule {

  static forRoot() {
    return {
      ngModule: DistributedStorageModule,
      providers: PROVIDERS
    };
  }

  static getRoutes(): Routes {
    return DISTRIBUTED_STORAGE_ROUTES;
  }

  // constructor(private appService: AppService) {
  //   // this.appService.registerService('DistributedStorageService', DistributedStorageService);
  // }

}
