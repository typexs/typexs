import {ITask, ITaskRuntimeContainer, TaskRuntime} from '@typexs/base';

export class SimpleTask implements ITask {

  @TaskRuntime()
  r: ITaskRuntimeContainer;

  name: string = 'simple_task';

  async exec() {
    let l = this.r.logger();
    l.info('just do it ;)');

    return {test: 'data'};
  }
}
