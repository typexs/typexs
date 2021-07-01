import {Incoming, ITask, ITaskRuntimeContainer, TaskRuntime} from '@typexs/base';
import {VProvider} from '../libs/VProvider';

export class TaskWithParameters implements ITask {

  @TaskRuntime()
  r: ITaskRuntimeContainer;

  name = 'task_with_parameters';

  @Incoming({optional: true, valueProvider: ['One', 'Two', 'Three']})
  valueString: string;

  @Incoming({optional: true, cardinality: 0, valueProvider: ['One', 'Two', 'Three']})
  valueStringArr: string[];

  @Incoming({optional: true, valueProvider: ['Fn-One', 'Fn-Two', 'Fn-Three']})
  valueFunction: string;

  @Incoming({optional: true, valueProvider: VProvider})
  valueClass: string;

  wait(time: number) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(null);
      }, time);
    });
  }


  async exec() {
    const l = this.r.logger();

    l.info('doing');

    return [this.valueString, this.valueFunction, this.valueClass];
  }
}
