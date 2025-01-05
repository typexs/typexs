import { Incoming, ITask, ITaskRuntimeContainer, Outgoing, TaskRuntime } from '@typexs/tasks';
import { TestHelper } from '@typexs/testing';


export class SimpleTaskWithParams implements ITask {

  name = 'simple_task_with_params';

  @TaskRuntime()
  r: ITaskRuntimeContainer;

  @Incoming()
  needThis: any;

  @Outgoing()
  forOthers: any;

  async exec() {
    const logger = this.r.logger();
    await TestHelper.wait(100);
    logger.info('task is running with parameter ' + JSON.stringify(this.needThis));

    this.r.progress(50);

    this.forOthers = 'best regards Robert';


    return {task: 'great run with parameters'};
  }
}
