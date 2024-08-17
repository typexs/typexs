import { ModuleWithProviders, NgModule } from '@angular/core';
import { SystemInfoService } from './services/system-info.service';
import { DefaultAuthGuardService } from './api/auth/default-auth-guard.service';
import { NoopAuthService } from './api/auth/noop-auth.service';
import { AuthService } from './api/auth/auth.service';
import { AuthGuardService } from './api/auth/auth-guard.service';
import { MessageService } from './messages/message.service';
import { AlertComponent } from './messages/alert.component';
import { PagerComponent } from './pager/pager.component';
import { PagerService } from './pager/PagerService';
import { AppService } from './services/app.service';
import { InvokerService } from './services/invoker.service';
import { HttpBackendService } from './services/http-backend.service';
import { DatatableComponent } from './datatable/datatable.component';
import { SimpleTableComponent } from './datatable/simple-table/simple-table.component';
import { SimpleTableCellComponent } from './datatable/simple-table/simple-table-cell.component';
import { SimpleTableCellValueComponent } from './datatable/simple-table/simple-table-cell-value.component';
import {
  CC_GRID,
  CC_GRID_CELL_ENTITY_OPERATIONS,
  CC_GRID_CELL_ENTITY_REFERENCE,
  CC_GRID_CELL_OBJECT_REFERENCE,
  CC_GRID_CELL_ROUTER_LINK,
  CC_GRID_CELL_VALUE,
  LIST_VIEW,
  SIMPLE_TABLE
} from './constants';
import { FormsModule } from '@angular/forms';
// eslint-disable-next-line max-len
import {
  SimpleTableCellEntityReferenceRendererComponent
} from './datatable/simple-table/simple-table-cell-entity-reference-renderer.component';
// eslint-disable-next-line max-len
import {
  SimpleTableCellObjectReferenceRendererComponent
} from './datatable/simple-table/simple-table-cell-object-reference-renderer.component';
// eslint-disable-next-line max-len
import {
  SimpleTableCellEntityOperationsRendererComponent
} from './datatable/simple-table/simple-table-cell-entity-operations-renderer.component';
import { RouterModule } from '@angular/router';
import { FreeQueryInputComponent } from './api/querying/free-query/free-query-input.component';
import { SimpleTableCellRouterLinkRendererComponent } from './datatable/simple-table/simple-table-cell-router-link-renderer.component';
import { Log } from './lib/log/Log';
import { CommonModule, DatePipe } from '@angular/common';
import { ComponentRegistryService } from './component/component-registry.service';
import { ObjectToComponentResolver } from './component/ObjectToComponentResolver';
import { ViewDataComponent } from './component/view/view-data.component';
import { ListViewComponent } from './datatable/list-view/list-view.component';
import { EntityResolverService } from './services/entity-resolver.service';
import { JsonComponent } from './component/entities/json/json.component';
import { EntityViewPageComponent } from './component/entities/page/page.component';
import { BackendService } from './api/backend/backend.service';
import { AbstractGridComponent } from './datatable/api/abstract-grid.component';
import { AbstractEntityViewComponent } from './component/entities/abstract-entity-view.component';
import { AbstractInstancableComponent } from './component/abstract-instancable.component';
import { AbstractQueryComponent } from './api/querying/abstract-query.component';
import { AbstractAggregateEmbeddedComponent } from './api/querying/abstract-aggregate-embedded.component';
import { QueryEmbeddedComponent } from './component/query/query-embedded.component';
import { AbstractComponent } from './component/abstract.component';
import { AbstractSimpleTableCellComponent } from './datatable/simple-table/abstract-simple-table-cell.component';
import { InfiniteScrollDirective } from './datatable/infinite-scroll/infinite-scroll.directive';
import { TemplateDirective } from './datatable/Template.directive';


const PROVIDERS = [
  MessageService,
  BackendService,
  HttpBackendService,
  SystemInfoService,
  AuthService,
  AuthGuardService,
  { provide: AuthService, useClass: NoopAuthService },
  { provide: AuthGuardService, useClass: DefaultAuthGuardService },
  { provide: BackendService, useClass: HttpBackendService },
  AppService,
  PagerService,
  InvokerService,
  ComponentRegistryService,
  ObjectToComponentResolver,
  EntityResolverService,
  DatePipe
];

const COMPONENTS = [
  AlertComponent,
  PagerComponent,
  DatatableComponent,
  JsonComponent,
  EntityViewPageComponent,
  ViewDataComponent,
  TemplateDirective,
  ListViewComponent,
  InfiniteScrollDirective,
  AbstractSimpleTableCellComponent,
  SimpleTableComponent,
  SimpleTableCellComponent,
  SimpleTableCellValueComponent,
  SimpleTableCellEntityReferenceRendererComponent,
  SimpleTableCellObjectReferenceRendererComponent,
  SimpleTableCellEntityOperationsRendererComponent,
  SimpleTableCellRouterLinkRendererComponent,
  FreeQueryInputComponent,
  AbstractComponent,
  AbstractGridComponent,
  AbstractEntityViewComponent,
  AbstractInstancableComponent,
  AbstractQueryComponent,
  AbstractAggregateEmbeddedComponent,
  QueryEmbeddedComponent
];


@NgModule({
  declarations: COMPONENTS,
  entryComponents: [
    JsonComponent,
    ListViewComponent,
    SimpleTableComponent,
    SimpleTableCellComponent,
    SimpleTableCellValueComponent,
    SimpleTableCellEntityReferenceRendererComponent,
    SimpleTableCellObjectReferenceRendererComponent,
    SimpleTableCellEntityOperationsRendererComponent,
    SimpleTableCellRouterLinkRendererComponent,
    QueryEmbeddedComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule
  ],
  exports: COMPONENTS,
  providers: PROVIDERS
  // schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class BaseModule {

  static forRoot(): ModuleWithProviders<any> {
    return {
      ngModule: BaseModule,
      providers: PROVIDERS
    };
  }

  /**
   * declaring default parameters
   *
   * @param appConfig
   */
  constructor(
    private appConfig: AppService,
    private compRegistry: ComponentRegistryService) {
    Log.initialize();
    compRegistry.setComponentClass([SIMPLE_TABLE, CC_GRID], SimpleTableComponent, {
      label: 'Simple table',
      datatable: true,
      default: true
    });

    compRegistry.setComponentClass([LIST_VIEW, CC_GRID], ListViewComponent, {
      label: 'List',
      datatable: true
    });

    compRegistry.setComponentClass([SIMPLE_TABLE, CC_GRID_CELL_VALUE], SimpleTableCellValueComponent);
    compRegistry.setComponentClass([SIMPLE_TABLE, CC_GRID_CELL_ENTITY_REFERENCE], SimpleTableCellEntityReferenceRendererComponent);
    compRegistry.setComponentClass([SIMPLE_TABLE, CC_GRID_CELL_OBJECT_REFERENCE], SimpleTableCellObjectReferenceRendererComponent);
    compRegistry.setComponentClass([SIMPLE_TABLE, CC_GRID_CELL_ENTITY_OPERATIONS], SimpleTableCellEntityOperationsRendererComponent);
    compRegistry.setComponentClass([SIMPLE_TABLE, CC_GRID_CELL_ROUTER_LINK], SimpleTableCellRouterLinkRendererComponent);


    compRegistry.setComponentForClass(JsonComponent, '.*', {
      context: 'json',
      label: 'JSON',
      weight: 1000
    });
    this.appConfig.getBackendClient().check();
  }

}
