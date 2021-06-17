import {Routes} from '@angular/router';
import {AdminComponent} from './admin.component';
import {SystemModulesComponent} from './system/modules/system-modules.component';
import {SystemRoutesComponent} from './system/routes/system-routes.component';
import {SystemStoragesComponent} from './system/storages/system-storages.component';
import {SystemConfigComponent} from './system/config/system-config.component';
import {NgRoutesComponent} from './ng/routes/ng-routes.component';
import {AuthGuardService} from '@typexs/base-ng';
import {StorageBackendsComponent} from '@typexs/storage-ng';
import {DashboardComponent} from './dashboard/dashboard.component';
import {SystemNodesComponent} from './system/nodes/system-nodes.component';
import {SettingsComponent} from './components/settings/settings.component';
import {PERMISSION_ACCESS_ADMIN_UI} from '@typexs/ng';
import {PERMISSION_ALLOW_STORAGES_VIEW} from '@typexs/server/libs/Constants';


export const ADMIN_ROUTES: Routes = [
  {
    path: 'admin', component: AdminComponent,
    canActivate: [AuthGuardService],
    data: {label: 'Admin', group: 'admin'},
    children: [
      {
        path: '',
        component: DashboardComponent,
        canActivate: [AuthGuardService],
        data: {
          label: 'Dashboard',
          group: 'admin',
          permissions: [PERMISSION_ACCESS_ADMIN_UI],
        }
      },
      {
        path: 'settings',
        component: SettingsComponent,
        canActivate: [AuthGuardService],
        data: {
          label: 'Settings',
          group: 'admin',
          permissions: [PERMISSION_ACCESS_ADMIN_UI]
        }
      },
      {
        path: 'system/nodes',
        component: SystemNodesComponent,
        canActivate: [AuthGuardService],
        data: {
          label: 'Nodes',
          group: 'admin',
          permissions: [PERMISSION_ACCESS_ADMIN_UI]
        }
      },
      {
        path: 'system/modules',
        component: SystemModulesComponent,
        canActivate: [AuthGuardService],
        data: {label: 'Modules', group: 'admin', permissions: [PERMISSION_ACCESS_ADMIN_UI]}
      },
      {
        path: 'system/routes',
        component: SystemRoutesComponent,
        data: {label: 'Routes', group: 'admin', permissions: [PERMISSION_ACCESS_ADMIN_UI]},
        canActivate: [AuthGuardService],
      },
      {
        path: 'system/storages',
        component: SystemStoragesComponent,
        data: {label: 'Storages', group: 'admin', permissions: [PERMISSION_ACCESS_ADMIN_UI]}
      },
      {
        path: 'system/componentRegistryService',
        component: SystemConfigComponent,
        data: {label: 'Config', group: 'admin', permissions: [PERMISSION_ACCESS_ADMIN_UI]},
        canActivate: [AuthGuardService]
      },
      {
        path: 'ng/routes',
        component: NgRoutesComponent,
        data: {label: 'Routes', group: 'admin', permissions: [PERMISSION_ACCESS_ADMIN_UI]},
        canActivate: [AuthGuardService]
      },

      {
        path: 'storage/backends',
        component: StorageBackendsComponent,
        data: {label: 'Backend', group: 'admin', permissions: [PERMISSION_ALLOW_STORAGES_VIEW]},
        canActivate: [AuthGuardService]
      },

    ]
  },


];


