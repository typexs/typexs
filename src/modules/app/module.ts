import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {AppComponent} from './app.component';
import {APP_MODULES} from './app.used.modules';
import {GroupDemoComponent} from './group-demo.component';
import {DemosComponent} from './demos.component';
import {CheckboxMatrixDemoComponent} from './checkbox-matrix-demo/checkbox-matrix-demo.component';
import {FORM_COMPONENTS} from '@typexs/ng-forms';
import {MenuDemoComponent} from './menu-demo/menu-demo.component';
import {MenuAccessService} from './menu-demo/MenuAccessService';
import {DummyComponent} from './dummy/dummy.component';
import {OptionsService} from './services/OptionsService';
import {PagerDemoComponent} from './pager-demo/pager-demo.component';
import {EmbeddedContentComponent} from './embedded-content/embedded-content.component';
import {EmbeddedContentDemoComponent} from './embedded-content/embedded-content-demo.component';
import {EmbeddedContentDirective} from './embedded-content/embedded-content.directive';
import {EmbeddedContent2Component} from './embedded-content/embedded-content-2.component';
import {LogoutComponent} from './dummy/logout/logout.component';
import {ProfileComponent} from './dummy/profile/profile.component';
import {NotificationDemoComponent} from './components/demos/notification/notification-demo.component';
import {InputDemoComponent} from './components/demos/form-input/input-demo.component';
import {TablesDemoComponent} from './components/demos/tables/tables-demo.component';
import {AgGridWrapperComponent} from './addons/ag-grid/ag-grid-wrapper.component';
import {NavigatorService} from '@typexs/ng-router-menu';
import {SimpleHtmlTableDemoComponent} from './components/demos/tables/simple-html-table-demo.component';
import {StorageService} from '@typexs/storage-ng';
import {EntityService} from '@typexs/entity-ng';
import {DistributedStorageService} from '@typexs/distributed-storage-ng';
import {DataViewComponent} from './dataview/dataview.component';
import {EmbeddedDistributedStorageComponent} from './components/demos/embedded-distributed-storage/embedded-distributed-storage.component';
import {UI_ADMIN_LAYOUT} from '@typexs/ng-admin-ui';
import {EmbeddedStorageDefaultComponent} from './components/demos/embedded-storage/default.component';
import {EmbeddedStorageOverviewComponent} from './components/demos/embedded-storage/overview.component';
import {EmbeddedStorageAgGridComponent} from './components/demos/embedded-storage/ag-grid.component';
import {SearchResultComponent} from './components/content-view/search/search-result.component';
import {SearchEntryComponent} from './components/content-view/search/search-entry.component';
import {ViewParentComponent} from './components/content-view/search/view-parent.component';
import {PersonComponent} from './components/entities/person/person.component';
import {Person} from './entities/Person';
import {TreeContentComponent} from './components/content-view/tree-content.component';
import {TreeContentDynamicChangeComponent} from './components/content-view/tree-content-dynamic-change.component';
import {SimpleViewVariantsComponent} from './components/content-view/simple-view-variants.component';
import {BookComponent} from './components/entities/book/book.component';
import {Book} from './entities/Book';
import {AppService, AuthService, ComponentRegistryService} from '@typexs/base-ng';


@NgModule({
  declarations: [
    AppComponent,
    DemosComponent,
    InputDemoComponent,
    TablesDemoComponent,
    GroupDemoComponent,
    CheckboxMatrixDemoComponent,
    TreeContentComponent,
    SearchResultComponent,
    SearchEntryComponent,
    ViewParentComponent,
    TreeContentDynamicChangeComponent,
    MenuDemoComponent,
    DummyComponent,
    PagerDemoComponent,
    EmbeddedContentComponent,
    EmbeddedContentDemoComponent,
    EmbeddedContentDirective,
    EmbeddedContent2Component,
    LogoutComponent,
    ProfileComponent,
    NotificationDemoComponent,
    AgGridWrapperComponent,
    SimpleHtmlTableDemoComponent,
    EmbeddedStorageOverviewComponent,
    EmbeddedStorageDefaultComponent,
    EmbeddedStorageAgGridComponent,
    EmbeddedDistributedStorageComponent,
    DataViewComponent,
    PersonComponent,
    BookComponent,
    SimpleViewVariantsComponent
  ],
  entryComponents: [
    ...FORM_COMPONENTS,
    SearchResultComponent,
    SearchEntryComponent,
    ViewParentComponent,
    AgGridWrapperComponent,
    PersonComponent,
    BookComponent
  ],
  imports: APP_MODULES,
  providers: [
    OptionsService,
    MenuAccessService
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule {

  constructor(private appService: AppService,
              private authService: AuthService,
              private navigatorService: NavigatorService,
              private storageService: StorageService,
              private entityService: EntityService,
              private dStorageService: DistributedStorageService,
              private compService: ComponentRegistryService) {

    /**
     * Enable admin theme layer
     */
    appService.setSettings(UI_ADMIN_LAYOUT, true);

    entityService.setNgUrlPrefix('/admin/entity');
    storageService.setNgUrlPrefix('/admin/storage');
    dStorageService.setNgUrlPrefix('/admin/distributed-storage');

    this.navigatorService.addGroupEntry('admin/entity/.*', {label: 'Entity', group: 'admin'});
    this.navigatorService.addGroupEntry('admin/storage/.*', {label: 'Storage', group: 'admin'});
    this.navigatorService.addGroupEntry('admin/distributed-storage/.*', {label: 'Distributed Storage', group: 'admin'});

    this.compService.setComponentForClass(PersonComponent, Person, {context: 'default', label: 'Default'});
    this.compService.setComponentForClass(BookComponent, Book, {context: 'default', label: 'Default'});

    authService.init();
    // navigatorService.addGroupEntry('tables', {label: 'Tables', group: 'demo'});
  }
}




