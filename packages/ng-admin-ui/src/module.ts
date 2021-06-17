import {NgModule, Provider} from '@angular/core';
import {RouterModule} from '@angular/router';
import {AdminComponent} from './admin.component';
import {SystemModulesComponent} from './system/modules/system-modules.component';
import {NavigatorService, RouterMenuModule} from '@typexs/ng-router-menu';
import {ADMIN_ROUTES} from './routes';
import {SystemRoutesComponent} from './system/routes/system-routes.component';
import {SystemStoragesComponent} from './system/storages/system-storages.component';
import {SystemConfigComponent} from './system/config/system-config.component';
import {NgRoutesComponent} from './ng/routes/ng-routes.component';
import {FormsModule} from '@typexs/ng-forms';
import {AppService, BaseModule} from '@typexs/base-ng';
import {BaseAdminThemeModule} from '@typexs/ng-theme-base';
import {DashboardComponent} from './dashboard/dashboard.component';
import {BackendTasksService, TasksModule} from '@typexs/tasks-ng';
import {SystemNodesComponent} from './system/nodes/system-nodes.component';
import {SystemNodeInfoComponent} from './system/nodes/node-info/system-node-info.component';
import {SettingsComponent} from './components/settings/settings.component';
import {CommonModule} from '@angular/common';

const PROVIDERS: Provider[] = [];


@NgModule({
  declarations: [
    AdminComponent,
    SystemModulesComponent,
    SystemRoutesComponent,
    SystemStoragesComponent,
    SystemConfigComponent,
    SystemNodesComponent,
    NgRoutesComponent,
    DashboardComponent,
    SystemNodeInfoComponent,
    SettingsComponent
  ],
  imports: [
    CommonModule,
    BaseAdminThemeModule,
    BaseModule,
    RouterMenuModule,
    RouterModule,
    FormsModule,
    TasksModule
  ],
  exports: [
    AdminComponent
  ],
  providers: PROVIDERS
})
export class AdminModule {


  static forRoot() {
    return {
      ngModule: AdminModule,
      providers: PROVIDERS
    };
  }

  static getRoutes() {
    return ADMIN_ROUTES;
  }

  constructor(private navigator: NavigatorService,
              private appService: AppService,
              private taskService: BackendTasksService) {
    // Startup stuff should be done once!

    taskService.setNgUrlPrefix('/admin/tasks');
    this.navigator.addGroupEntry('admin/system/.*', {label: 'System', group: 'admin'});
    this.navigator.addGroupEntry('admin/ng/.*', {label: 'Angular', group: 'admin'});
    this.navigator.addGroupEntry('admin/tasks/.*', {label: 'Tasks', group: 'admin'});
  }


}
