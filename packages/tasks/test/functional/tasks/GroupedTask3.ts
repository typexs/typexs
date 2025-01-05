import {ITask} from '../../../src/lib/ITask';
import {Outgoing} from "../../../src/lib/decorators/Outgoing";

export class GroupedTask3 implements ITask {
  name: string = 'grouped_3';

  groups: string[] = ['grouping'];


  async exec() {
    return this.name
  }

}
