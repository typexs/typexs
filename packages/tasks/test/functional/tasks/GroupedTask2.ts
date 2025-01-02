import {ITask} from '../../../src/lib/ITask';
import {Outgoing} from "../../../src/lib/decorators/Outgoing";

export class GroupedTask2 implements ITask {

  name: string = 'grouped_2';

  groups: string[] = ['grouped'];


  async exec() {
    return this.name
  }

}
