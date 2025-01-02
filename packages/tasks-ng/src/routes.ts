import {TasksMetadataComponent} from './components/metadata/tasks-metadata.component';
// TODO move this to @typexs/task modul when created
import {
  PERMISSION_ALLOW_TASK_EXEC,
  PERMISSION_ALLOW_TASK_EXEC_PATTERN,
  PERMISSION_ALLOW_TASK_LOG,
  PERMISSION_ALLOW_TASK_STATUS,
  PERMISSION_ALLOW_TASK_GET_METADATA
} from '@typexs/tasks';
import {AuthGuardService} from '@typexs/base-ng';
import {TasksLogsComponent} from './components/logs-list/tasks-logs.component';
import {TasksExecutionComponent} from './components/execution/tasks-execution.component';
import {TaskStatusPageComponent} from './components/status/task-status-page.component';
import {Routes} from '@angular/router';

export const TASK_ROUTES: Routes = [
  {
    path: 'tasks/list',
    component: TasksMetadataComponent,
    data: {label: 'List', group: 'admin', permissions: [PERMISSION_ALLOW_TASK_GET_METADATA]},
    canActivate: [AuthGuardService]
  },
  {
    path: 'tasks/logs',
    component: TasksLogsComponent,
    data: {label: 'Logs', group: 'admin', permissions: [PERMISSION_ALLOW_TASK_LOG]},
    canActivate: [AuthGuardService]
  },
  {
    path: 'tasks/run/:taskName',
    component: TasksExecutionComponent,
    data: {label: 'Execute', group: 'admin', skip: true, permissions: [PERMISSION_ALLOW_TASK_EXEC, PERMISSION_ALLOW_TASK_EXEC_PATTERN]},
    canActivate: [AuthGuardService]
  },
  {
    path: 'tasks/status/:nodeId/:runnerId',
    component: TaskStatusPageComponent,
    data: {label: 'Status', group: 'admin', skip: true, permissions: [PERMISSION_ALLOW_TASK_STATUS]},
    canActivate: [AuthGuardService]
  },
];
