import {ITask} from '@typexs/tasks';


export class SimpleTaskWithError implements ITask {

  name = 'simple_task_with_error';

  async exec() {
    throw new Error('never ready');
  }
}
