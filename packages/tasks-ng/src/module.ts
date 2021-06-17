import {NgModule} from '@angular/core';
import {FormsModule} from '@typexs/ng-forms';
import {BaseModule} from '@typexs/base-ng';
import {RouterModule} from '@angular/router';
import {FormsModule as NgFormsModule} from '@angular/forms';
import {BackendTasksService} from './backend-tasks.service';
import {TasksMetadataComponent} from './metadata/tasks-metadata.component';
import {TasksExecutionComponent} from './execution/tasks-execution.component';
import {TaskStatusComponent} from './status/task-status.component';
import {TaskStatusRowComponent} from './status/task-status-row.component';
import {StorageModule} from '@typexs/storage-ng';
import {CommonModule, DatePipe} from '@angular/common';
import {TasksLogComponent} from './log/tasks-log.component';
import {TaskStatusPageComponent} from './status/task-status-page.component';
import {TasksLogViewerComponent} from './status/log-viewer/tasks-log-viewer.component';
import {TASK_ROUTES} from './routes';

const PROVIDERS = [
  BackendTasksService,
  DatePipe
];

@NgModule({
  declarations: [
    TasksMetadataComponent,
    TasksExecutionComponent,
    TaskStatusComponent,
    TaskStatusPageComponent,
    TasksLogComponent,
    TaskStatusRowComponent,
    TasksLogViewerComponent
  ],
  imports: [
    CommonModule,
    BaseModule,
    RouterModule,
    NgFormsModule,
    FormsModule,
    StorageModule
  ],
  exports: [
    TasksMetadataComponent,
    TasksExecutionComponent,
    TaskStatusComponent,
    TasksLogComponent,
    TaskStatusRowComponent,
  ],
  providers: PROVIDERS
})
export class TasksModule {

  static forRoot() {
    return {
      ngModule: TasksModule,
      providers: PROVIDERS
    };
  }


  static getRoutes() {
    return TASK_ROUTES;
  }


}
