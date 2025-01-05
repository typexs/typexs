import {ITask} from '../../../src/lib/ITask';
import {Outgoing} from "../../../src/lib/decorators/Outgoing";

export class GroupedTask4 implements ITask {
  name: string = 'grouped_4';

  groups: string[] = ['grouping'];


  async exec() {
    return this.name
  }

}
