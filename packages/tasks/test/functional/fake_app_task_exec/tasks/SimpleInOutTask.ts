import {ITask} from '../../../../src/lib/ITask';
import {Incoming} from '../../../../src/lib/decorators/Incoming';
import {Outgoing} from '../../../../src/lib/decorators/Outgoing';

export class SimpleInOutTask implements ITask {
  name = 'simple_in_out_task';

  content = 'test';

  @Incoming()
  income: string;

  @Outgoing()
  output: string;

  async exec() {
    this.output = this.income.repeat(3).trim();
  }

}
