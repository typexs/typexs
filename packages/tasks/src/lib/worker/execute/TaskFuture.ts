/**
 * TODO: Future object which waits till a task is done
 */

import { EventEmitter } from 'events';
import { EventBus, subscribe, unsubscribe } from '@allgemein/eventbus';
import { ITaskFutureOptions } from './ITaskFutureOptions';
import { ITaskRunnerResult } from '../../ITaskRunnerResult';
import { TaskEvent } from '../../event/TaskEvent';
import { TaskProposeEvent } from '../../event/TaskProposeEvent';
import { AbstractTaskEvent } from '../../event/AbstractTaskEvent';
import { TASK_STATE_ERRORED, TASK_STATE_REQUEST_ERROR, TASK_STATE_STOPPED } from '../../Constants';
import { values } from '@typexs/generic';


const future_finished = 'future_finished';

export class TaskFuture extends EventEmitter {

  private start: Date = new Date();

  private runnerId: string;

  private options: ITaskFutureOptions;

  private targetState: { [k: string]: string } = {};

  private targetResults: { [k: string]: ITaskRunnerResult } = {};

  private events: AbstractTaskEvent[] = [];

  private finished: boolean = false;

  constructor(options: ITaskFutureOptions) {
    super();
    this.options = options;
  }


  getEventId() {
    return this.options.eventId;
  }

  getRunnerId() {
    return this.runnerId;
  }

  async register() {
    subscribe(TaskEvent)(this, 'onTaskEvent');
    subscribe(TaskProposeEvent)(this, 'onTaskEvent');
    await EventBus.register(this);
  }


  async unregister() {
    try {
      await EventBus.unregister(this);
      unsubscribe(this, TaskEvent, 'onTaskEvent');
      unsubscribe(this, TaskProposeEvent, 'onTaskEvent');
    } catch (e) {
    }
  }


  async onTaskEvent(event: TaskEvent) {
    if (this.options.eventId === event.reqEventId) {
      if (!this.runnerId) {
        this.runnerId = event.data.id;
      }
      if (this.options.filter && this.options.filter(event)) {
        this.events.push(event);
        this.emit('future_event', event);
      }
      this.targetState[event.respId] = event.state;
      if (event.state === TASK_STATE_STOPPED || event.state === TASK_STATE_ERRORED || event.state === TASK_STATE_REQUEST_ERROR) {
        if (event.data) {
          this.targetResults[event.respId] = event.data;
        }
      }

      if (this.isFinished()) {
        await this.close();
      }
    }
  }

  async close() {
    await this.unregister();
    this.finished = true;
    this.emit(future_finished);
  }

  await(timeout: number = 0): Promise<ITaskRunnerResult[]> {
    if (this.finished) {
      const _values = values(this.targetResults);
      return Promise.resolve(_values);
    }

    return new Promise<ITaskRunnerResult[]>((resolve, reject) => {
      const t = timeout > 0 ? setTimeout(() => {
        clearTimeout(t);
        reject(new Error('timeout error: ' + timeout + 'ms passed'));
      }, timeout) : null;

      this.once(future_finished, () => {
        clearTimeout(t);
        const _values = values(this.targetResults);
        resolve(_values);
      });
    });
  }


  isFinished() {
    let yes = true;
    for (const k of  Object.keys(this.targetState)) {
      if (![TASK_STATE_STOPPED, TASK_STATE_REQUEST_ERROR, TASK_STATE_ERRORED].includes(this.targetState[k])) {
        yes = false;
        break;
      }
    }
    return yes;
  }

}
