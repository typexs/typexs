import { ITask } from '../libs/tasks/ITask';
import { TN_TASKS_CLEANUP } from '../libs/tasks/Constants';
import { Invoker } from '../base/Invoker';
import { C_STORAGE_DEFAULT, XS_P_$COUNT } from '../libs/Constants';
import { IStorageRef } from '../libs/storage/IStorageRef';
import { Incoming } from '../libs/tasks/decorators/Incoming';
import { TasksApi } from '../api/Tasks.api';
import { TaskLog } from '../entities/TaskLog';
import { DateUtils } from '../libs/utils/DateUtils';
import { Inject } from 'typedi';
import { TaskRuntimeContainer } from '../libs/tasks/TaskRuntimeContainer';
import { TaskRuntime } from '../libs/tasks/decorators/TaskRuntime';

/**
 * Task which cleanups database for older task log entries
 */
export class TasksCleanup implements ITask {
  name = TN_TASKS_CLEANUP;

  @TaskRuntime()
  runtime: TaskRuntimeContainer;

  @Inject(Invoker.NAME)
  invoker: Invoker;

  @Inject(C_STORAGE_DEFAULT)
  storageRef: IStorageRef;

  /**
   * Offset in seconds default is 7 days
   */
  @Incoming({ optional: true })
  offset: number = 7 * 24 * 60 * 60;

  async exec() {
    const logger = this.runtime.logger();

    await this.invoker.use(TasksApi).beforeCleanup(this.offset);
    const date = DateUtils.sub({ seconds: this.offset });
    const controller = this.storageRef.getController();
    let running = true;
    while (running) {
      const entries = await controller.find(TaskLog, { stopped: { $le: date } }, { limit: 30 });
      if (entries.length === 0) {
        running = false;
        break;
      }
      logger.debug('remove task log entries ' + entries.length + ' of ' + entries[XS_P_$COUNT]);

      await controller.remove(entries);
      await this.invoker.use(TasksApi).onCleanup(entries, this.offset);
      entries.map(x => {
        this.runtime.counter('remove').inc();
      });
    }

    await this.invoker.use(TasksApi).afterCleanup(this.offset);
  }
}
