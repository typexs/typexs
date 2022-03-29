import { AbstractMessage } from '../../../messaging/AbstractMessage';
import { Tasks } from '../../Tasks';
import { TASK_RUNNER_SPEC } from '../../Constants';
import { ITaskExecutionRequestOptions } from '../ITaskExecutionRequestOptions';
import { TaskRef } from '../../TaskRef';
import { TasksHelper } from '../../TasksHelper';
import { System } from '../../../../libs/system/System';
import { TaskFuture } from './TaskFuture';
import { TaskEvent } from '../../event/TaskEvent';
import { TaskProposeEvent } from '../../event/TaskProposeEvent';
import { clone, get, intersection, isArray, keys, shuffle } from 'lodash';

export class TaskExecutionExchange extends AbstractMessage<TaskEvent, TaskEvent> {

  private tasks: Tasks;

  private requestOptions: ITaskExecutionRequestOptions;

  private passingTaskStates = ['request_error'];

  private event: TaskProposeEvent;

  constructor(system: System, tasks: Tasks) {
    super(system, TaskProposeEvent, TaskEvent);
    this.tasks = tasks;
    this.timeout = 10000;
  }


  create(
    taskSpec: TASK_RUNNER_SPEC[],
    parameters: any = {},
    options: ITaskExecutionRequestOptions = {
      targetIds: [],
      skipTargetCheck: false
    }) {
    this.requestOptions = options;
    this.timeout = get(options, 'timeout', 10000);

    if (options.passingTaskState) {
      this.passingTaskStates.push(options.passingTaskState);
    } else {
      this.passingTaskStates.push('enqueue');
    }

    let workerNodes = null;
    if (!options.targetIds || !isArray(options.targetIds)) {
      workerNodes = TasksHelper.getWorkerNodes(this.system);
      let onNodes = options.executeOnMultipleNodes ? options.executeOnMultipleNodes : 1;

      let nodesForSelection = clone(workerNodes);

      if (options.randomWorkerSelection) {
        nodesForSelection = shuffle(nodesForSelection);
      }
      this.targetIds = [];
      while (nodesForSelection.length > 0 && onNodes > 0) {
        onNodes--;
        this.targetIds.push(nodesForSelection.shift());
      }
    }

    if (!options.skipTargetCheck) {
      if (!workerNodes) {
        workerNodes = TasksHelper.getWorkerNodes(this.system);
      }

      const possibleTargetIds: string[][] = [workerNodes];
      const tasks: TaskRef[] = this.tasks.getTasks(TasksHelper.getTaskNames(taskSpec));
      for (const taskRef of tasks) {
        possibleTargetIds.push(taskRef.nodeInfos.filter(x => x.hasWorker).map(x => x.nodeId));
      }

      if (options.targetIds && isArray(options.targetIds)) {
        if (options.targetIds.length === 0) {
          // get intersection of nodeInfos
          this.targetIds = intersection(...possibleTargetIds);
        } else {
          this.targetIds = intersection(options.targetIds, ...possibleTargetIds);
        }
      }

      if (this.targetIds.length === 0) {
        throw new Error('not target intersection found for tasks: ' + taskSpec.join(', '));
      }

    } else {
      if (!this.targetIds && options.targetIds) {
        this.targetIds = options.targetIds;
      }
    }

    this.event = new TaskProposeEvent();
    this.event.taskSpec = taskSpec;
    for (const k of keys(parameters)) {
      if (!/^_/.test(k)) {
        this.event.addParameter(k, get(parameters, k));
      }
    }
    return this;
  }


  async run() {
    await this.send(this.event);
    return this.results;
  }


  requestCheck(res: TaskEvent): boolean {
    // wait for results or wait for enqueue
    // check state
    if (this.passingTaskStates.indexOf(res.state) === -1) {
      return false;
    }
    return true;
  }

  doPostProcess(responses: TaskEvent[], err: Error) {
    return responses;
  }

  async future(filter: (event: TaskEvent) => boolean = (event: TaskEvent) => event.state !== 'running') {
    const future = new TaskFuture({
      eventId: this.event.id,
      filter: filter
    });
    await future.register();
    return future;
  }

}
