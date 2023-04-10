import {ITask, ITaskRuntimeContainer, TaskRuntime} from '@typexs/base';
import {Incoming} from '@typexs/base/index';

export class LongRunningTask implements ITask {

  @TaskRuntime()
  r: ITaskRuntimeContainer;

  name = 'long_running_task';


  @Incoming({optional: true})
  iterations: number = 100;

  @Incoming({optional: true})
  timeout: number = 1000;


  wait(time: number) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(null);
      }, time);
    });
  }


  async exec() {
    this.r.total(this.iterations);
    const l = this.r.logger();

    const res: any = {inc: 0};
    let i = 0;
    while (i < this.iterations) {
      await this.wait(this.timeout);
      i++;
      res.inc = i;
      l.info('doing ' + i + ' iteration');
      this.r.progress(i);
    }


    return res;
  }
}
