import {CUSTOM_ELEMENTS_SCHEMA, ModuleWithProviders, NgModule} from '@angular/core';
import {SystemInfoService} from './services/system-info.service';
import {DefaultAuthGuardService} from './api/auth/default-auth-guard.service';
import {NoopAuthService} from './api/auth/noop-auth.service';
import {AuthService} from './api/auth/auth.service';
import {AuthGuardService} from './api/auth/auth-guard.service';
import {MessageService} from './messages/message.service';
import {AlertComponent} from './messages/alert.component';
import {PagerComponent} from './pager/pager.component';
import {PagerService} from './pager/PagerService';
import {AppService} from './services/app.service';
import {InvokerService} from './services/invoker.service';
import {HttpBackendService} from './services/http-backend.service';
import {DatatableComponent} from './datatable/datatable.component';
import {SimpleHtmlTableComponent} from './datatable/simple-html-table/simple-html-table.component';
import {SimpleHtmlCellComponent} from './datatable/simple-html-table/simple-html-cell.component';
import {SimpleHtmlCellValueComponent} from './datatable/simple-html-table/simple-html-cell-value.component';
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
import {FormsModule} from '@angular/forms';
// eslint-disable-next-line max-len
import {SimpleHtmlCellEntityReferenceRendererComponent} from './datatable/simple-html-table/simple-html-cell-entity-reference-renderer.component';
// eslint-disable-next-line max-len
import {SimpleHtmlCellObjectReferenceRendererComponent} from './datatable/simple-html-table/simple-html-cell-object-reference-renderer.component';
// eslint-disable-next-line max-len
import {SimpleHtmlCellEntityOperationsRendererComponent} from './datatable/simple-html-table/simple-html-cell-entity-operations-renderer.component';
import {RouterModule} from '@angular/router';
import {FreeQueryInputComponent} from './api/querying/free-query/free-query-input.component';
import {SimpleHtmlCellRouterLinkRendererComponent} from './datatable/simple-html-table/simple-html-cell-router-link-renderer.component';
import {Log} from './lib/log/Log';
import {CommonModule} from '@angular/common';
import {ComponentRegistryService} from './component/component-registry.service';
import {ObjectToComponentResolver} from './component/ObjectToComponentResolver';
import {ViewDataComponent} from './component/view/view-data.component';
import {ListViewComponent} from './datatable/list-view/list-view.component';
import {EntityResolverService} from './services/entity-resolver.service';
import {JsonComponent} from './component/entities/json/json.component';
import {EntityViewPageComponent} from './component/entities/page/page.component';
import {BackendService} from './api/backend/backend.service';
import {AbstractGridComponent} from './datatable/abstract-grid.component';
import {AbstractEntityViewComponent} from './component/entities/abstract-entity-view.component';
import {AbstractComponent} from './component/AbstractComponent';
import {AbstractQueryEmbeddedComponent} from './api/querying/abstract-query-embedded.component';
import {AbstractAggregateEmbeddedComponent} from './api/querying/abstract-aggregate-embedded.component';
import {QueryEmbeddedComponent} from './component/query/query-embedded.component';


const PROVIDERS = [
  MessageService,
  BackendService,
  HttpBackendService,
  SystemInfoService,
  AuthService,
  AuthGuardService,
  {provide: AuthService, useClass: NoopAuthService},
  {provide: AuthGuardService, useClass: DefaultAuthGuardService},
  {provide: BackendService, useClass: HttpBackendService},
  AppService,
  PagerService,
  InvokerService,
  ComponentRegistryService,
  ObjectToComponentResolver,
  EntityResolverService
];

const COMPONENTS = [
  AlertComponent,
  PagerComponent,
  DatatableComponent,
  JsonComponent,
  EntityViewPageComponent,
  ViewDataComponent,
  ListViewComponent,
  SimpleHtmlTableComponent,
  SimpleHtmlCellComponent,
  SimpleHtmlCellValueComponent,
  SimpleHtmlCellEntityReferenceRendererComponent,
  SimpleHtmlCellObjectReferenceRendererComponent,
  SimpleHtmlCellEntityOperationsRendererComponent,
  SimpleHtmlCellRouterLinkRendererComponent,
  FreeQueryInputComponent,
  AbstractGridComponent,
  AbstractEntityViewComponent,
  AbstractComponent,
  AbstractQueryEmbeddedComponent,
  AbstractAggregateEmbeddedComponent,
  QueryEmbeddedComponent
];


@NgModule({
  declarations: COMPONENTS,
  entryComponents: [
    JsonComponent,
    ListViewComponent,
    SimpleHtmlTableComponent,
    SimpleHtmlCellComponent,
    SimpleHtmlCellValueComponent,
    SimpleHtmlCellEntityReferenceRendererComponent,
    SimpleHtmlCellObjectReferenceRendererComponent,
    SimpleHtmlCellEntityOperationsRendererComponent,
    SimpleHtmlCellRouterLinkRendererComponent,
    QueryEmbeddedComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule
  ],
  exports: COMPONENTS,
  providers: PROVIDERS,
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
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
  constructor(private appConfig: AppService,
              private compRegistry: ComponentRegistryService) {
    Log.initialize();
    compRegistry.setComponentClass([SIMPLE_TABLE, CC_GRID], SimpleHtmlTableComponent, {
      label: 'Simple table',
      datatable: true,
      default: true
    });

    compRegistry.setComponentClass([LIST_VIEW, CC_GRID], ListViewComponent, {
      label: 'List',
      datatable: true
    });

    compRegistry.setComponentClass([SIMPLE_TABLE, CC_GRID_CELL_VALUE], SimpleHtmlCellValueComponent);
    compRegistry.setComponentClass([SIMPLE_TABLE, CC_GRID_CELL_ENTITY_REFERENCE], SimpleHtmlCellEntityReferenceRendererComponent);
    compRegistry.setComponentClass([SIMPLE_TABLE, CC_GRID_CELL_OBJECT_REFERENCE], SimpleHtmlCellObjectReferenceRendererComponent);
    compRegistry.setComponentClass([SIMPLE_TABLE, CC_GRID_CELL_ENTITY_OPERATIONS], SimpleHtmlCellEntityOperationsRendererComponent);
    compRegistry.setComponentClass([SIMPLE_TABLE, CC_GRID_CELL_ROUTER_LINK], SimpleHtmlCellRouterLinkRendererComponent);


    compRegistry.setComponentForClass(JsonComponent, '.*', {
      context: 'json',
      label: 'JSON',
      weight: 1000
    });
    this.appConfig.getBackendClient().check();
  }

}
