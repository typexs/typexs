import { Routes } from '@angular/router';

import { DemosComponent } from './demos.component';
import { GridFieldsComponent } from './components/grid-fields/grid-fields.component';
import { CheckboxMatrixDemoComponent } from './checkbox-matrix-demo/checkbox-matrix-demo.component';
import { MenuDemoComponent } from './menu-demo/menu-demo.component';
import { DummyComponent } from './dummy/dummy.component';
import { MenuAccessService } from './menu-demo/MenuAccessService';
import { PagerDemoComponent } from './pager-demo/pager-demo.component';
import { LogoutComponent } from './dummy/logout/logout.component';
import { ProfileComponent } from './dummy/profile/profile.component';
import { NotificationDemoComponent } from './components/notification/notification-demo.component';
import { InputDemoComponent } from './components/forms/input/input-demo.component';
import { SimpleTableDemoComponent } from './components/grids/simple-table/simple-table-demo.component';
import { StorageModule } from '@typexs/storage-ng';
import { EntityModule } from '@typexs/entity-ng';
import { DistributedStorageModule } from '@typexs/distributed-storage-ng';
import { TasksModule } from '@typexs/tasks-ng';
import { DataViewComponent } from './dataview/dataview.component';
import { EmbeddedDistributedStorageComponent } from './components/embedded-distributed-storage/embedded-distributed-storage.component';
import { AdminModule } from '@typexs/ng-admin-ui';
import { EmbeddedStorageOverviewComponent } from './components/embedded-storage/overview.component';
import { EmbeddedStorageDefaultComponent } from './components/embedded-storage/default.component';
import { EmbeddedStorageAgGridComponent } from './components/embedded-storage/ag-grid.component';
import { TreeContentDynamicChangeComponent } from './components/content-view/tree-content-dynamic-change.component';
import { TreeContentComponent } from './components/content-view/tree-content.component';
import { SimpleViewVariantsComponent } from './components/content-view/simple-view-variants.component';
import { CTXT_ROUTE_USER_LOGOUT, CTXT_ROUTE_USER_PROFILE, EntityViewPageComponent } from '@typexs/base-ng';
import { SearchPageComponent } from '@typexs/search-ng';
import { GridOverviewComponent } from './components/grids/overview/grid-overview.component';
import { ListViewDemoComponent } from './components/grids/list-view/list-view-demo.component';


export const APP_ROUTES: Routes = [
  // ...SearchModule.getRoutes(),
  {
    path: 'search',
    component: SearchPageComponent,
    // canActivate: [AuthGuardService],
    data: { label: 'Suche', group: 'demo' }
  },
  {
    path: 'demo',
    component: DemosComponent,
    data: { label: 'Demo', group: 'demo' },
    children: [
      {
        path: '',
        component: DummyComponent,
        data: { label: 'Placeholder', skip: true, group: 'demo' }
      },
      {
        path: 'input',
        component: InputDemoComponent,
        data: { label: 'Input', group: 'demo' }
      },
      {
        path: 'group',
        component: GridFieldsComponent,
        data: { label: 'Group Demo', group: 'demo' }
      },
      {
        path: 'checkbox-matrix',
        component: CheckboxMatrixDemoComponent,
        data: { label: 'Checkbox-Matrix', group: 'demo' }
      },
      {
        path: 'menu-demo',
        component: MenuDemoComponent,
        data: { label: 'Menus', group: 'demo' }
      },
      {
        path: 'grids',
        component: GridOverviewComponent,
        data: { label: 'Grids', group: 'demo' },
        children: [
          { path: '', redirectTo: 'simple', pathMatch: 'full' },
          {
            path: 'simple',
            component: SimpleTableDemoComponent,
            data: { label: 'Simple Table', group: 'tables' }
          },
          {
            path: 'list-view',
            component: ListViewDemoComponent,
            data: { label: 'List view', group: 'tables' }
          }
        ]
      },

      {
        path: 'pager',
        component: PagerDemoComponent,
        data: { label: 'Pager', group: 'demo' }
      },
      {
        path: 'notifications',
        component: NotificationDemoComponent,
        data: { label: 'Notifications', group: 'demo' }
      },
      {
        path: 'data-viewer',
        component: DataViewComponent,
        data: { label: 'Data viewer', group: 'demo' }
      }
    ]
  },
  {
    path: 'entity/:name/:id',
    component: EntityViewPageComponent,
    data: { label: 'Entity view', group: 'demo', skip: true }
  },
  {
    path: 'content',
    data: { group: 'demo' },
    children: [
      {
        path: 'simple-views',
        component: SimpleViewVariantsComponent,
        data: { label: 'Simple views', group: 'demo' }
      },
      {
        path: 'tree-view',
        component: TreeContentComponent,
        data: { label: 'Tree view', group: 'demo' }
      },
      {
        path: 'tree-view-dynamic',
        component: TreeContentDynamicChangeComponent,
        data: { label: 'Tree view Child', group: 'demo' }
      }
    ]
  },
  {
    path: 'embedded',
    data: { group: 'demo' },
    children: [
      {
        path: 'storage',
        component: EmbeddedStorageOverviewComponent,
        data: { label: 'Embedded Storage', group: 'demo' },
        children: [
          {
            path: '',
            component: EmbeddedStorageDefaultComponent,
            data: { label: 'Default', group: 'demo', skip: true }
          },
          {
            path: 'ag-grid',
            component: EmbeddedStorageAgGridComponent,
            data: { label: 'AgGrid', group: 'demo', skip: true }
          }
        ]
      },
      {
        path: 'distributed-storage',
        component: EmbeddedDistributedStorageComponent,
        data: { label: 'Embedded Distributed Storage', group: 'demo' }
      }
    ]
  },
  // {
  //   path: 'admin',
  //   loadChildren: () => import('../admin/module').then(x => x.AdminModule)
  // },

  ...AdminModule.getRoutes(),
  {
    path: 'admin',
    children: [
      ...TasksModule.getRoutes(),
      ...StorageModule.getRoutes(),
      ...EntityModule.getRoutes(),
      ...DistributedStorageModule.getRoutes()
    ]
  },
  {
    path: 'menu',
    component: DummyComponent,
    data: { label: 'Menu Base', group: 'menu' },
    children: [
      {
        path: 'menu-item-1',
        component: DummyComponent,
        data: { label: 'Menu Item 1', group: 'menu' }
      },
      {
        path: 'menu-item-2',
        component: DummyComponent,
        canActivate: [MenuAccessService],
        data: { label: 'Menu Item 2', group: 'menu' }

      },
      {
        path: 'menu-item-3',
        component: DummyComponent,
        canActivate: [MenuAccessService],
        data: { label: 'Menu Item 3', group: 'menu' }
      }
    ]
  },
  {
    path: 'menu-grouped',
    component: DummyComponent,
    data: { label: 'Menu Grouped Base', group: 'menu-grouped' },
    children: [
      {
        path: 'menu-group-item-1',
        component: DummyComponent,
        data: { label: 'Menu Grouped Item 1', group: 'menu-grouped' }
      },
      {
        path: 'menu-group-item-2',
        component: DummyComponent,
        canActivate: [MenuAccessService],
        data: { label: 'Menu Grouped Item 2', group: 'menu-grouped' }

      },
      {
        path: 'menu-group-item-3',
        component: DummyComponent,
        canActivate: [MenuAccessService],
        data: { label: 'Menu Grouped Item 3', group: 'menu-grouped' }
      }
    ]
  },
  {
    path: 'user/logout',
    component: LogoutComponent,
    data: { label: 'Logout', skip: true, context: CTXT_ROUTE_USER_LOGOUT }
  }
  ,
  {
    path: 'user/profile',
    component: ProfileComponent,
    data: { label: 'Profile', skip: true, context: CTXT_ROUTE_USER_PROFILE }
  }
  ,
  {
    path: '', redirectTo: 'demo', pathMatch: 'full'
  }
  ,
  {
    path: '**', redirectTo: 'demo'
  }

];


