import { TaskRunner } from '../lib/TaskRunner';
import { TaskRun } from '../lib/TaskRun';
import { TaskLog } from '../entities/TaskLog';


export interface ITasksApi {

  beforeCleanup?(offset: number, date?: Date): void;

  onCleanup?(entry: TaskLog | TaskLog[], offset: number, date?: Date): void;

  afterCleanup?(offset: number, date?: Date): void;

  /**
   * on task command startup
   */
  onStartup?(): void;

  /**
   * on task command shutdown
   */
  onShutdown?(): void;

  onInit?(run: TaskRun | TaskRunner): void;

  onBefore?(runner: TaskRunner): void;

  onStart?(run: TaskRun): void;

  onProgress?(run: TaskRun): void;

  onStop?(run: TaskRun): void;

  onAfter?(runner: TaskRunner): void;

  onError?(run: TaskRun | TaskRunner): void;

}
