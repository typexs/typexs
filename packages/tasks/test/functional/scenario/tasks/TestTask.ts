import {ITask} from '../../../../src/lib/ITask';

export class TestTask implements ITask {
  name = 'test';

  async exec(done: Function) {
    done(null, {res: 'okay'});
  }
}
