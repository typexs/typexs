import {ITask} from '../../../src/lib/ITask';
import {TaskRuntime} from "../../../src/lib/decorators/TaskRuntime";
import {ITaskRuntimeContainer} from "../../../src/lib/ITaskRuntimeContainer";

export class SimpleTaskNoName implements ITask {

  @TaskRuntime()
  runtime: ITaskRuntimeContainer;

  exec( done: (err: Error, res: any) => void) {
    done(null, 'test');
  }

}
