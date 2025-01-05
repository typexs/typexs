import {ITask} from '../../../src/lib/ITask';
import {Incoming} from '../../../src/lib/decorators/Incoming';

export class SimpleWorkerTask implements ITask {
  name = 'simple_worker_task';

  @Incoming({optional: true})
  data: string;


  async exec() {
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(null);
      }, 100);
    });
    return 'test';
  }

}
