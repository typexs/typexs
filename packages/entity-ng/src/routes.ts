import {Routes} from '@angular/router';
import {EntityTypesComponent} from './types/entity-types.component';
import {AuthGuardService} from '@typexs/base-ng';
import {EntityModifyComponent} from './modify/entity-modify.component';
import {EntityViewComponent} from './view/entity-view.component';
import {EntityDeleteComponent} from './delete/entity-delete.component';
import {EntityQueryComponent} from './query/page/entity-query.component';
import {EntityStructComponent} from './struct/entity-struct.component';
import {
  PERMISSION_ALLOW_ACCESS_ENTITY,
  PERMISSION_ALLOW_ACCESS_ENTITY_METADATA,
  PERMISSION_ALLOW_ACCESS_ENTITY_PATTERN,
  PERMISSION_ALLOW_CREATE_ENTITY,
  PERMISSION_ALLOW_CREATE_ENTITY_PATTERN,
  PERMISSION_ALLOW_DELETE_ENTITY,
  PERMISSION_ALLOW_DELETE_ENTITY_PATTERN,
  PERMISSION_ALLOW_UPDATE_ENTITY,
  PERMISSION_ALLOW_UPDATE_ENTITY_PATTERN
} from '@typexs/schema';

export const ENTITY_ROUTES: Routes = [
  {
    path: 'entity/types',
    component: EntityTypesComponent,
    data: {
      label: 'Types', permissions: [PERMISSION_ALLOW_ACCESS_ENTITY_METADATA]
    },
    canActivate: [AuthGuardService]
  },

  {
    path: 'entity/:name/create',
    component: EntityModifyComponent,
    data: {
      label: 'Create entity', skip: true,
      permissions: [PERMISSION_ALLOW_CREATE_ENTITY, PERMISSION_ALLOW_CREATE_ENTITY_PATTERN]
    },
    canActivate: [AuthGuardService]
  },
  {
    path: 'entity/:name/view/:id',
    component: EntityViewComponent,
    data: {
      label: 'View entity', skip: true
      ,
      permissions: [PERMISSION_ALLOW_ACCESS_ENTITY, PERMISSION_ALLOW_ACCESS_ENTITY_PATTERN]
    },
    canActivate: [AuthGuardService]
  },
  {
    path: 'entity/:name/edit/:id',
    component: EntityModifyComponent,
    data: {
      label: 'Edit entity', skip: true
      ,
      permissions: [PERMISSION_ALLOW_UPDATE_ENTITY, PERMISSION_ALLOW_UPDATE_ENTITY_PATTERN]
    },
    canActivate: [AuthGuardService]
  },
  {
    path: 'entity/:name/delete/:id',
    component: EntityDeleteComponent,
    data: {
      label: 'Delete entity', skip: true,
      permissions: [PERMISSION_ALLOW_DELETE_ENTITY, PERMISSION_ALLOW_DELETE_ENTITY_PATTERN]
    },
    canActivate: [AuthGuardService]
  },
  {
    path: 'entity/:name/query',
    component: EntityQueryComponent,
    data: {
      label: 'List entities', skip: true,
      permissions: [PERMISSION_ALLOW_ACCESS_ENTITY, PERMISSION_ALLOW_ACCESS_ENTITY_PATTERN]
    },
    canActivate: [AuthGuardService]
  },
  {
    path: 'entity/:name/structure',
    component: EntityStructComponent,
    data: {
      label: 'Entity type structure', skip: true,
      permissions: [PERMISSION_ALLOW_ACCESS_ENTITY_METADATA]
    },
    canActivate: [AuthGuardService]
  },

];
