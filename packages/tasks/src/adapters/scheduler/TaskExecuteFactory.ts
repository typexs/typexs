import { IScheduleDef, IScheduleFactory, Schedule } from '@typexs/base';
import { TasksHelper } from '../../lib/TasksHelper';
import { ITaskExectorOptions } from '../../lib/ITaskExectorOptions';
import { TASK_RUNNER_SPEC } from '../../lib/Constants';
import { clone, get, has, isArray } from '@typexs/generic';

export interface ITaskSchedule extends ITaskExectorOptions {
  name?: TASK_RUNNER_SPEC | TASK_RUNNER_SPEC[];
  names?: TASK_RUNNER_SPEC | TASK_RUNNER_SPEC[];
}

export class TaskExecuteFactory implements IScheduleFactory {

  create(taskNames: TASK_RUNNER_SPEC[], params: ITaskExectorOptions = { skipTargetCheck: false, executionConcurrency: 1 }) {
    return function() {
      return TasksHelper.exec(taskNames, params);
    };
  }


  /**
   * Attach definition
   *
   * @param schedule
   */
  async attach(schedule: Schedule): Promise<boolean> {
    const taskDef: ITaskSchedule = get(schedule.options, 'tasks', get(schedule.options, 'task', null));
    if (taskDef) {
      const key = has(taskDef, 'name') ? 'name' : 'names';
      const taskSpecs = isArray(taskDef[key]) ? taskDef[key] as TASK_RUNNER_SPEC[] : [taskDef[key]] as TASK_RUNNER_SPEC[];

      let params = clone(taskDef);
      delete params[key];
      if (has(params, 'params')) {
        params = params['params'];
      }
      if (has(params, 'parallel')) {
        params.executionConcurrency = get(params, 'parallel', 1);
      }
      schedule.execute = this.create(taskSpecs, params);
      return true;
    }
    return false;
  }


  async detect(opts: IScheduleDef) {
    return has(opts, 'task') || has(opts, 'tasks');
  }


  async isAvailable() {
    return true;
  }


}
