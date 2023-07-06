import { Incoming, ITask, ITaskRuntimeContainer, TaskRuntime } from '@typexs/base';
import { VProvider } from '../libs/VProvider';

export class TaskWithRequiredParameters implements ITask {

  @TaskRuntime()
  r: ITaskRuntimeContainer;

  name = 'task_with_required_parameters';

  @Incoming()
  valueString: string;

  async exec() {
    return this.valueString;
  }
}
