import {ITask} from '../../../../src/lib/ITask';

export class SimpleTaskExceptionRunning implements ITask {
  name = 'simple_task_exception_running';

  content = 'test';

  async exec() {
    throw new Error('test error');
  }

}
