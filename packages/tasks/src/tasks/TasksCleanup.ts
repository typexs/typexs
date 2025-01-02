import { ITask } from '../lib/ITask';
import { TN_TASKS_CLEANUP } from '../lib/Constants';
import { Invoker } from '@typexs/base';
import { C_STORAGE_DEFAULT, XS_P_$COUNT } from '@typexs/base';
import { IStorageRef } from '@typexs/base';
import { Incoming } from '../lib/decorators/Incoming';
import { TasksApi } from './../api/Tasks.api';
import { TaskLog } from '../entities/TaskLog';
import { DateUtils } from '@typexs/base';
import { Inject } from 'typedi';
import { TaskRuntimeContainer } from '../lib/TaskRuntimeContainer';
import { TaskRuntime } from '../lib/decorators/TaskRuntime';

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
  date: string = (new Date()).toISOString();

  /**
   * Offset in seconds default is 7 days
   */
  @Incoming({ optional: true })
  offset: number = 7 * 24 * 60 * 60;


  /**
   *
   */
  @Incoming({ optional: true })
  size: number = 100;


  async exec() {
    const logger = this.runtime.logger();
    let fromDate = new Date();
    try {
      if (this.date) {
        fromDate = DateUtils.fromISO(this.date);
      }
    } catch (e) {
      fromDate = new Date();
    }


    await this.invoker.use(TasksApi).beforeCleanup(this.offset, fromDate);
    const date = DateUtils.sub({ seconds: this.offset }, fromDate);
    const controller = this.storageRef.getController();
    let running = true;
    while (running) {
      const entries = await controller.find(TaskLog, { stopped: { $le: date } }, { limit: this.size });
      if (entries.length === 0) {
        running = false;
        break;
      }
      logger.debug('remove task log entries ' + entries.length + ' of ' + entries[XS_P_$COUNT]);
      await controller.remove(TaskLog, { tasksId: { $in: entries.map(x => x.tasksId) } });
      await this.invoker.use(TasksApi).onCleanup(entries, this.offset, fromDate);
      entries.map(x => {
        this.runtime.counter('remove').inc();
      });
    }

    await this.invoker.use(TasksApi).afterCleanup(this.offset, fromDate);
  }

}
