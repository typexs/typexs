import { TASK_ROUTES } from './routes';
import { RegistryFactory } from '@allgemein/schema-api';
import { C_TASKS, Tasks } from '@typexs/base';
import { NgModule } from '@angular/core';
import { FormsModule } from '@typexs/forms-ng';
import { BaseModule } from '@typexs/base-ng';
import { RouterModule } from '@angular/router';
import { StorageModule } from '@typexs/storage-ng';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule as NgFormsModule } from '@angular/forms';
import { BackendTasksService } from './services/backend-tasks.service';
import { TasksMetadataComponent } from './components/metadata/tasks-metadata.component';
import { TasksExecutionComponent } from './components/execution/tasks-execution.component';
import { TaskStatusComponent } from './components/status/task-status.component';
import { TaskStatusRowComponent } from './components/status/task-status-row.component';
import { TasksLogComponent } from './components/log/tasks-log.component';
import { TaskStatusPageComponent } from './components/status/task-status-page.component';
import { TasksLogViewerComponent } from './components/log-viewer/tasks-log-viewer.component';

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
    TasksLogViewerComponent
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

  constructor() {
    RegistryFactory.register(C_TASKS, Tasks);
  }

}
