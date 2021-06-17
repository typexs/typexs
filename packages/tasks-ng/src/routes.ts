import {TasksMetadataComponent} from './metadata/tasks-metadata.component';
import {
  PERMISSION_ALLOW_TASK_EXEC,
  PERMISSION_ALLOW_TASK_EXEC_PATTERN,
  PERMISSION_ALLOW_TASK_LOG,
  PERMISSION_ALLOW_TASK_STATUS,
  PERMISSION_ALLOW_TASKS_LIST
} from '@typexs/server';
import {AuthGuardService} from '@typexs/base-ng';
import {TasksLogComponent} from './log/tasks-log.component';
import {TasksExecutionComponent} from './execution/tasks-execution.component';
import {TaskStatusPageComponent} from './status/task-status-page.component';
import {Routes} from '@angular/router';

export const TASK_ROUTES: Routes = [
  {
    path: 'tasks/list',
    component: TasksMetadataComponent,
    data: {label: 'List', group: 'admin', permissions: [PERMISSION_ALLOW_TASKS_LIST]},
    canActivate: [AuthGuardService]
  },
  {
    path: 'tasks/logs',
    component: TasksLogComponent,
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
