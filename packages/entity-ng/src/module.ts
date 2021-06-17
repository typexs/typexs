import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {EntityTypesComponent} from './types/entity-types.component';
import {EntityModifyComponent} from './modify/entity-modify.component';
import {EntityDeleteComponent} from './delete/entity-delete.component';
import {EntityQueryComponent} from './query/page/entity-query.component';
import {EntityViewComponent} from './view/entity-view.component';
import {EntityStructComponent} from './struct/entity-struct.component';
import {EntityService} from './entity.service';
import {EntityOptionsService} from './entity-options.service';
import {FormsModule} from '@typexs/ng-forms';
import {BaseModule} from '@typexs/base-ng';
import {RouterModule} from '@angular/router';
import {FormsModule as NgFormsModule} from '@angular/forms';
import {EntityQueryEmbeddedComponent} from './query/embedded/entity-query-embedded.component';
import {AppService} from '@typexs/base-ng';
import {ENTITY_ROUTES} from './routes';
import {CommonModule} from '@angular/common';

export const ENTITY_OPTIONS_SERVICE = EntityOptionsService.name;

const PROVIDERS = [
  EntityService,
  EntityOptionsService,
  {provide: ENTITY_OPTIONS_SERVICE, useClass: EntityOptionsService}
];

@NgModule({
  declarations: [
    EntityTypesComponent,
    EntityModifyComponent,
    EntityDeleteComponent,
    EntityQueryComponent,
    EntityViewComponent,
    EntityStructComponent,
    EntityQueryEmbeddedComponent
  ],
  entryComponents: [
    EntityQueryEmbeddedComponent
  ],
  imports: [
    CommonModule,
    BaseModule,
    RouterModule,
    NgFormsModule,
    FormsModule
  ],
  exports: [
    EntityTypesComponent,
    EntityModifyComponent,
    EntityDeleteComponent,
    EntityQueryComponent,
    EntityViewComponent,
    EntityStructComponent
  ],
  providers: PROVIDERS,
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class EntityModule {

  static forRoot() {
    return {
      ngModule: EntityModule,
      providers: PROVIDERS
    };
  }


  static getRoutes() {
    return ENTITY_ROUTES;
  }


  constructor(private appService: AppService) {
    // this.appService.registerService('EntityService', EntityService);
  }

}
