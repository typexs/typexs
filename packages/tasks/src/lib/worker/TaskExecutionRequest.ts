import { cloneDeep, concat, find, get, intersection, remove } from '@typexs/generic';
import { IWorkerInfo, Log, System } from '@typexs/base';
import { EventEmitter } from 'events';
import { EventBus, subscribe } from '@allgemein/eventbus';
import { TaskQueueWorker } from '../../workers/TaskQueueWorker';
import { ITaskExecutionRequestOptions } from './ITaskExecutionRequestOptions';
import { Tasks } from '../Tasks';
import { TaskRef } from '../TaskRef';
import { TASK_RUNNER_SPEC, TASK_STATE_ENQUEUE, TASK_STATE_REQUEST_ERROR } from '../Constants';
import { TasksHelper } from '../TasksHelper';
import { TaskEvent } from '../event/TaskEvent';
import { TaskProposeEvent } from '../event/TaskProposeEvent';


export class TaskExecutionRequest extends EventEmitter {


  private system: System;


  private tasks: Tasks;

  private timeout = 10000;

  private event: TaskEvent;

  private responses: TaskEvent[] = [];

  private targetIds: string[] = [];

  private results: any[] = [];

  private active = true;

  constructor(system: System, tasks: Tasks) {
    super();
    this.system = system;
    this.tasks = tasks;
    this.once('postprocess', this.postProcess.bind(this));
  }


  async run(taskSpec: TASK_RUNNER_SPEC[],
    parameters: any = {},
    options: ITaskExecutionRequestOptions = {
      targetIds: [], skipTargetCheck: false
    }): Promise<TaskEvent[]> {

    this.timeout = get(options, 'timeout', 10000);

    if (!options.skipTargetCheck) {
      const workerIds = concat([], [this.system.node], this.system.nodes)
        .filter(n => {
          const x = find(n.contexts, c => c.context === 'workers');
          return get(x, 'workers', []).find((y: IWorkerInfo) => y.className === TaskQueueWorker.NAME);
        }).map(x => x.nodeId);


      const possibleTargetIds: string[][] = [workerIds];
      const tasks: TaskRef[] = this.tasks.getTasksByNames(TasksHelper.getTaskNames(taskSpec));
      for (const taskRef of tasks) {
        possibleTargetIds.push(taskRef.nodeInfos.filter(x => x.hasWorker).map(x => x.nodeId));
      }

      if (options.targetIds.length === 0) {
        // get intersection of nodeInfos
        this.targetIds = intersection(...possibleTargetIds);
      } else {
        this.targetIds = intersection(options.targetIds, ...possibleTargetIds);
      }

      if (this.targetIds.length === 0) {
        throw new Error('not target intersection found for tasks: ' + taskSpec.join(', '));
      }

    } else {
      this.targetIds = options.targetIds;
    }

    this.event = new TaskProposeEvent();
    this.event.nodeId = this.system.node.nodeId;
    this.event.taskSpec = taskSpec;
    this.event.targetIds = this.targetIds;
    for (const k of  Object.keys(parameters)) {
      if (!/^_/.test(k)) {
        this.event.addParameter(k, get(parameters, k));
      }
    }


    await EventBus.register(this);
    Log.debug('fire execution result ' + this.event.nodeId + '->' + this.event.id);
    let _err: Error = null;
    try {
      await Promise.all([this.ready(), EventBus.postAndForget(this.event)]);
    } catch (err) {
      _err = err;
      Log.error(err);
    } finally {
    }

    await EventBus.unregister(this);
    this.removeAllListeners();

    Log.debug('fire execution finished for ' + this.event.id);
    if (_err) {
      throw _err;
    }


    return this.results;
  }


  postProcess(err: Error) {
    this.results = this.responses;
    this.emit('finished', err, this.results);
  }


  @subscribe(TaskEvent)
  onResults(event: TaskEvent): any {
    Log.debug('task event entered ' + event.id + ' ' + event.state + ' ' + event.respId);
    if (!this.active) {
      return;
    }

    // has query event
    if (!this.event) {
      return;
    }

    // check state
    if ([TASK_STATE_ENQUEUE, TASK_STATE_REQUEST_ERROR].indexOf(event.state) === -1) {
      return null;
    }

    // has same id
    if (this.event.id !== event.id) {
      return;
    }

    // waiting for the results?
    if (this.targetIds.indexOf(event.respId) === -1) {
      return;
    }
    remove(this.targetIds, x => x === event.respId);

    const eClone = cloneDeep(event);
    this.responses.push(eClone);

    Log.debug('task exec request [' + this.targetIds.length + ']: ', eClone);
    if (this.targetIds.length === 0) {
      this.active = false;
      this.emit('postprocess');
    }
  }


  ready() {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => {
        this.emit('postprocess', new Error('timeout error'));
        clearTimeout(t);
      }, this.timeout);

      this.once('finished', (err: Error, data: any) => {
        clearTimeout(t);
        if (err) {
          Log.error(err);
          if (data) {
            resolve(data);
          } else {
            reject(err);
          }
        } else {
          resolve(data);
        }
      });

    });
  }


}
