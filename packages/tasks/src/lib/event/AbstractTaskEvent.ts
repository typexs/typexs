import { AbstractEvent, DateUtils, IError } from '@typexs/base';
import { ITaskRunnerResult } from '../ITaskRunnerResult';
import { snakeCase } from '@typexs/generic';
import { TASK_RUNNER_SPEC, TASK_STATE_PROPOSED, TASK_STATES } from '../Constants';
import { IQueueWorkload } from '@allgemein/queue';

/**
 * Id is the runner id
 */
export abstract class AbstractTaskEvent extends AbstractEvent implements IQueueWorkload {

  /**
   * Name or names of task(s) to execute
   */
  taskSpec: TASK_RUNNER_SPEC | TASK_RUNNER_SPEC[];

  /**
   * Arguments to pass to task runner
   */
  parameters?: { [name: string]: any };

  /**
   * Errors
   */
  errors: IError[] = [];

  /**
   * Current state of task
   */
  state: TASK_STATES = TASK_STATE_PROPOSED;

  /**
   * Topic of this event
   */
  topic: 'data' | 'log' = 'data';

  /**
   * log data
   */
  log: any[];


  data: ITaskRunnerResult;


  constructor() {
    super();
    const dateStr = DateUtils.format('YYYYMMDD-HHmmssSSS');
    this.id = dateStr + '-' + this.id;
  }

  addParameter(key: string, value: any) {
    if (!this.parameters) {
      this.parameters = {};
    }
    this.parameters[snakeCase(key)] = value;
  }

}
