import {ITask} from '../../../src/lib/ITask';
import {Outgoing} from '../../../src/lib/decorators/Outgoing';

export class GroupedTask1 implements ITask {
  name = 'grouped_1';

  groups: string[] = ['grouped'];


  async exec() {
    return this.name;
  }

}
