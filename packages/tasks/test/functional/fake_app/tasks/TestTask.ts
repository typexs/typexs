import {Incoming} from '../../../../src/lib/decorators/Incoming';
import {ITask} from '../../../../src/lib/ITask';

export class TestTask implements ITask {

  name = 'test';

  description = 'Hallo welt';

  @Incoming()
  someValue: string;

  async exec(done: Function) {
    done(null, {res: 'okay', value: this.someValue});
  }
}
