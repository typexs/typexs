import {ITask} from '../../../src/lib/ITask';
import {ITaskRuntimeContainer} from '../../../src/lib/ITaskRuntimeContainer';
import {Incoming} from '../../../src/lib/decorators/Incoming';
import {TaskRuntime} from '../../../src/lib/decorators/TaskRuntime';

export class SimpleTaskWithDefaultArgs implements ITask {
  name = 'simple_task_with_default_args';

  @TaskRuntime()
  runtime: ITaskRuntimeContainer;

  @Incoming()
  value = 'SomeValue';

  @Incoming({default: ['asd', 'bfr']})
  list: string[];


  async exec() {
    return '';
  }

}
