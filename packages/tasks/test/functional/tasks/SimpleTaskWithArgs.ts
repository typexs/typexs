import {ITask} from '../../../src/lib/ITask';
import {ITaskRuntimeContainer} from '../../../src/lib/ITaskRuntimeContainer';
import {Incoming} from '../../../src/lib/decorators/Incoming';
import {Outgoing} from '../../../src/lib/decorators/Outgoing';
import {TaskRuntime} from '../../../src/lib/decorators/TaskRuntime';

export class SimpleTaskWithArgs implements ITask {
  name = 'simple_task_with_args';

  @TaskRuntime()
  runtime: ITaskRuntimeContainer;

  @Incoming({optional: false})
  incoming: string;

  @Incoming({name: 'param_list'})
  list: string[];

  @Outgoing()
  outgoing: string;


  async exec() {
    this.runtime.total(100);
    // console.log('doing important stuff ' + this.incoming);
    this.runtime.progress(50);
    this.runtime.progress(100);
    this.outgoing = this.incoming + '-test ' + this.list.join(';');
    return this.outgoing;
  }

}
