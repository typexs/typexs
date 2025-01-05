import {ITask} from '../../../src/lib/ITask';
import {Incoming} from '../../../src/lib/decorators/Incoming';

export class DependingTask implements ITask {
  name = 'depending';


  @Incoming({name: 'data'})
  fromDependent: any;



  async exec() {
    this.fromDependent.test = 'true';
    return this.fromDependent;
  }


}
