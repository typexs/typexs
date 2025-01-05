import {ITask} from '../../../src/lib/ITask';
import {Outgoing} from "../../../src/lib/decorators/Outgoing";

export class GroupingTask implements ITask {
  name: string = 'grouping';


  async exec() {
    return this.name
  }

}
