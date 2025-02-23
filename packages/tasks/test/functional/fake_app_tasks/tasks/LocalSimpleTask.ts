import { Incoming, ITask, ITaskRuntimeContainer, TaskRuntime } from '@typexs/tasks';
import { TestHelper } from '../../../../../server/test/functional/TestHelper';


export class LocalSimpleTask implements ITask {

  name = 'local_simple_task';

  @Incoming({ optional: true })
  value: string;

  @TaskRuntime()
  r: ITaskRuntimeContainer;

  async exec() {
    const logger = this.r.logger();
    await TestHelper.wait(100);

    logger.info('task is running');

    this.r.progress(50);


    return { task: 'great local run' };
  }
}
