import { Inject } from 'typedi';
import { IBootstrap, IShutdown, RuntimeLoader, Workers } from '@typexs/base';
import { Tasks } from './lib/Tasks';
import { TasksHelper } from './lib/TasksHelper';
import { TaskRunnerRegistry } from './lib/TaskRunnerRegistry';


export class Startup implements IBootstrap, IShutdown {

  @Inject(Tasks.NAME)
  tasks: Tasks;

  @Inject(TaskRunnerRegistry.NAME)
  taskRunnerRegistry: TaskRunnerRegistry;


  @Inject(RuntimeLoader.NAME)
  loader: RuntimeLoader;

  @Inject(Workers.NAME)
  workers: Workers;



  async bootstrap(): Promise<void> {
    TasksHelper.prepare(this.tasks, this.loader, this.workers.contains('TaskQueueWorker'));
    await this.taskRunnerRegistry.onStartup();

  }



  /**
   * impl. onShutdown function, shutdowns following components:
   * - cache
   * - distributed system
   * - EventBus
   * - tasks
   * - workers
   * - watchers
   */
  async shutdown() {
    await this.taskRunnerRegistry.onShutdown();
    this.tasks.reset();
  }

}
