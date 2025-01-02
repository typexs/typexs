import {TaskRuntime} from '../../../src/lib/decorators/TaskRuntime';
import {ITaskRuntimeContainer} from '../../../src/lib/ITaskRuntimeContainer';
import {ITask} from '../../../src/lib/ITask';

export class SimpleTaskWithRuntimeLog implements ITask {

  @TaskRuntime()
  runtime: ITaskRuntimeContainer;

  async exec() {
    const logger = this.runtime.logger();

    logger.info('doing something');
    logger.warn('doing something wrong');
    logger.error('doing something wrong\nnewline');

    return 'test';
  }

}
