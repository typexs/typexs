import { System } from '@typexs/base';
import { Inject } from 'typedi';
import { Tasks } from '../Tasks';
import { TaskExecutionExchange } from './execute/TaskExecutionExchange';


export class TaskRequestFactory {

  @Inject(System.NAME)
  private system: System;

  @Inject(Tasks.NAME)
  private tasks: Tasks;

  /**
   * @Deprecated
   */
  // createRequest() {
  //   return new TaskExecutionRequest(this.system, this.tasks);
  // }

  executeRequest() {
    return new TaskExecutionExchange(this.system, this.tasks);
  }
}
