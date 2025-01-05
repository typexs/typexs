import {ITask} from '../../../../src/lib/ITask';
import {Incoming} from '../../../../src/lib/decorators/Incoming';

export class SimpleTaskRunning implements ITask {
  name = 'simple_task_running';

  content = 'test';

  @Incoming({optional: true})
  timeout: number = 4000;

  async exec() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(this.content);
      }, this.timeout);
    });
  }

}
