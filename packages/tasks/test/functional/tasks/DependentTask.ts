import {ITask} from '../../../src/lib/ITask';
import {Outgoing} from '../../../src/lib/decorators/Outgoing';

export class DependentTask implements ITask {
  name = 'dependent';


  @Outgoing()
  data: any;


  async exec() {
    this.data = {new: 'data'};
  }

}
