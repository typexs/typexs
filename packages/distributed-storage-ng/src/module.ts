import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {FormsModule} from '@typexs/ng-forms';
import {AppService, BaseModule} from '@typexs/base-ng';
import {RouterModule} from '@angular/router';
import {CommonModule} from '@angular/common';
import {DISTRIBUTED_STORAGE_ROUTES} from './routes';
import {DistributedStorageService} from './services/distributed_storage.service';
import {DistributedStorageQueryEmbeddedComponent} from './components/query/embedded/query-embedded.component';
import {DistributedStorageQueryPageComponent} from './components/query/page/query-page.component';

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
    FormsModule
  ],
  exports: COMPONENTS,
  providers: PROVIDERS,
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DistributedStorageModule {

  static forRoot() {
    return {
      ngModule: DistributedStorageModule,
      providers: PROVIDERS
    };
  }

  static getRoutes() {
    return DISTRIBUTED_STORAGE_ROUTES;
  }

  constructor(private appService: AppService) {
    // this.appService.registerService('DistributedStorageService', DistributedStorageService);
  }

}
