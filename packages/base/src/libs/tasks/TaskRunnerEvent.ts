import {AbstractEvent} from '../../libs/messaging/AbstractEvent';
import { TASK_STATE_PROPOSED, TASK_STATES } from './Constants';
import {ITaskRunnerStatus} from './ITaskRunnerStatus';

export class TaskRunnerEvent extends AbstractEvent implements ITaskRunnerStatus {

  /**
   * Intern task runner number
   */
  nr: number;

  /**
   * Runner states
   */
  state: TASK_STATES = TASK_STATE_PROPOSED;

  /**
   * all task names
   */
  taskNames: string[] = [];

  /**
   * running tasknames
   */
  running: string[] = [];

  /**
   * running tasknames
   */
  finished: string[] = [];

  /**
   * started
   */
  started: Date;


  /**
   * updated
   */
  updated: Date;

  /**
   * stopped
   */
  stopped: Date;
}
