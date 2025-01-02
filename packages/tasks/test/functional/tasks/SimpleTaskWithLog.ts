import {ITask} from '../../../src/lib/ITask';
import {TaskRuntime} from '../../../src/lib/decorators/TaskRuntime';
import {ITaskRuntimeContainer} from '../../../src/lib/ITaskRuntimeContainer';

export class SimpleTaskWithLog implements ITask {

  @TaskRuntime()
  runtime: ITaskRuntimeContainer;

  async exec() {
    const logger = this.runtime.logger();

    this.runtime.progress(20);

    logger.info('doing something');
    logger.warn('doing something wrong');
    logger.error('doing something wrong\nnewline');

    this.runtime.progress(40);

    return 'test';
  }

}
