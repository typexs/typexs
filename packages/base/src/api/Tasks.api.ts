import { ITasksApi } from './ITasksApi';
import { TaskRunner } from '../libs/tasks/TaskRunner';
import { TaskRun } from '../libs/tasks/TaskRun';
import { TaskLog } from '../entities/TaskLog';


export class TasksApi implements ITasksApi {

  beforeCleanup(offset: number, date?: Date) {
  }

  onCleanup?(entry: TaskLog | TaskLog[], offset: number, date?: Date) {

  }

  afterCleanup(offset: number, date?: Date) {
  }

  onInit(run: TaskRun | TaskRunner) {
  }

  onBefore(runner: TaskRunner) {
  }

  onStart(run: TaskRun) {
  }

  onProgress(run: TaskRun) {
  }

  onStop(run: TaskRun) {
  }

  onAfter(runner: TaskRunner) {
  }

  onError(run: TaskRun | TaskRunner) {
  }


  onStartup() {
  }


  onShutdown() {
  }

}
