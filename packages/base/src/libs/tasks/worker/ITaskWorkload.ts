import {IQueueWorkload} from '../../queue/IQueueWorkload';
import {TASK_RUNNER_SPEC} from '../Constants';
import { TaskEvent } from '../event/TaskEvent';

export interface ITaskWorkload extends IQueueWorkload {

  /**
   * reuse event object
   */
  event: TaskEvent;

  /**
   * Names of the taskRef's to run
   */
  names: TASK_RUNNER_SPEC[];

  /**
   * Arguments for task execution
   */
  parameters?: any;


}
