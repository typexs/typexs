import {StorageTypesComponent} from './types/storage-types.component';
import {AuthGuardService} from '@typexs/base-ng';
import {StorageStructComponent} from './struct/storage-struct.component';
import {StorageModifyComponent} from './modify/storage-modify.component';
import {StorageViewComponent} from './view/storage-view.component';
import {StorageDeleteComponent} from './delete/storage-delete.component';
import {StorageQueryComponent} from './query/page/storage-query.component';
import {StorageAggregateComponent} from './aggregate/page/storage-aggregate.component';
import {Routes} from '@angular/router';
import {
  PERMISSION_ALLOW_ACCESS_STORAGE_ENTITY,
  PERMISSION_ALLOW_ACCESS_STORAGE_ENTITY_PATTERN,
  PERMISSION_ALLOW_ACCESS_STORAGE_METADATA,
  PERMISSION_ALLOW_DELETE_STORAGE_ENTITY,
  PERMISSION_ALLOW_DELETE_STORAGE_ENTITY_PATTERN,
  PERMISSION_ALLOW_SAVE_STORAGE_ENTITY,
  PERMISSION_ALLOW_SAVE_STORAGE_ENTITY_PATTERN,
  PERMISSION_ALLOW_STORAGE_ENTITY_VIEW
} from '@typexs/server';

export const STORAGE_ROUTES: Routes = [
  {
    path: 'storage/types',
    component: StorageTypesComponent,
    data: {
      label: 'Types',
      permissions: [
        PERMISSION_ALLOW_ACCESS_STORAGE_METADATA
      ]
    },
    canActivate: [AuthGuardService]
  },
  {
    path: 'storage/:name/structure',
    component: StorageStructComponent,
    data: {
      label: 'Entity type structure',
      skip: true,
      permissions: [
        PERMISSION_ALLOW_ACCESS_STORAGE_METADATA
      ]

    },
    canActivate: [AuthGuardService]
  },
  {
    path: 'storage/:name/create',
    component: StorageModifyComponent,
    data: {
      label: 'Create entity',
      skip: true,
      permissions: [
        PERMISSION_ALLOW_SAVE_STORAGE_ENTITY,
        PERMISSION_ALLOW_SAVE_STORAGE_ENTITY_PATTERN
      ]
    },
    canActivate: [AuthGuardService]
  },
  {
    path: 'storage/:name/view/:id',
    component: StorageViewComponent,
    data: {
      label: 'View entity',
      skip: true,
      permissions: [
        PERMISSION_ALLOW_STORAGE_ENTITY_VIEW
      ]
    },
    canActivate: [AuthGuardService]
  },
  {
    path: 'storage/:name/edit/:id',
    component: StorageModifyComponent,
    data: {
      label: 'Edit entity', skip: true,
      permissions: [
        PERMISSION_ALLOW_SAVE_STORAGE_ENTITY,
        PERMISSION_ALLOW_SAVE_STORAGE_ENTITY_PATTERN
      ]
    },
    canActivate: [AuthGuardService]
  },
  {
    path: 'storage/:name/delete/:id',
    component: StorageDeleteComponent,
    data: {
      label: 'Delete entity', skip: true,
      permissions: [
        PERMISSION_ALLOW_DELETE_STORAGE_ENTITY,
        PERMISSION_ALLOW_DELETE_STORAGE_ENTITY_PATTERN
      ]
    },
    canActivate: [AuthGuardService]
  },
  {
    path: 'storage/:name/query',
    component: StorageQueryComponent,
    data: {
      label: 'List entities', skip: true,
      permissions: [
        PERMISSION_ALLOW_ACCESS_STORAGE_ENTITY,
        PERMISSION_ALLOW_ACCESS_STORAGE_ENTITY_PATTERN
      ]
    },
    canActivate: [AuthGuardService]
  },
  {
    path: 'storage/:name/aggregate',
    component: StorageAggregateComponent,
    data: {
      label: 'List entities', skip: true,
      permissions: [
        PERMISSION_ALLOW_ACCESS_STORAGE_ENTITY,
        PERMISSION_ALLOW_ACCESS_STORAGE_ENTITY_PATTERN
      ]
    },
    canActivate: [AuthGuardService]
  },

];
