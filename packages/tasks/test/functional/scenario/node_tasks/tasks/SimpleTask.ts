import { ITask, ITaskRuntimeContainer, TaskRuntime } from '@typexs/tasks';
import { TestHelper } from '@typexs/testing';


export class SimpleTask implements ITask {

  name = 'simple_task';

  @TaskRuntime()
  r: ITaskRuntimeContainer;

  async exec() {
    const logger = this.r.logger();
    await TestHelper.wait(100);

    logger.info('task is running');

    this.r.progress(50);



    return {task: 'great run'};
  }
}
