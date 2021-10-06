import { cloneDeep, has, isArray, isEmpty, isString } from 'lodash';
import { Inject } from 'typedi';
import { EventBus, subscribe } from 'commons-eventbus';
import { ClassUtils } from '@allgemein/base';
import { freemem, totalmem } from 'os';
import { Bootstrap } from '../Bootstrap';
import { TaskEvent } from './../libs/tasks/worker/TaskEvent';
import { Log } from '../libs/logging/Log';
import { ITaskWorkload } from './../libs/tasks/worker/ITaskWorkload';
import { ITaskRunnerResult } from '../libs/tasks/ITaskRunnerResult';
import { TasksHelper } from '../libs/tasks/TasksHelper';
import { IError } from '../libs/exceptions/IError';
import { CL_TASK_QUEUE_WORKER, TASKRUN_STATE_UPDATE } from '../libs/tasks/Constants';
import { IWorker } from '../libs/worker/IWorker';
import { IWorkerStatisitic } from '../libs/worker/IWorkerStatisitic';
import { IQueueProcessor } from '../libs/queue/IQueueProcessor';
import { AsyncWorkerQueue } from '../libs/queue/AsyncWorkerQueue';
import { ILoggerApi } from '../libs/logging/ILoggerApi';
import { ITaskQueueWorkerOptions } from '../libs/tasks/worker/ITaskQueueWorkerOptions';
import { TaskRunnerRegistry } from '../libs/tasks/TaskRunnerRegistry';
import { Cache } from '../libs/cache/Cache';


export class TaskQueueWorker implements IQueueProcessor<ITaskWorkload>, IWorker {

  static NAME = CL_TASK_QUEUE_WORKER;

  name = 'task_queue_worker';

  inc = 0;

  nodeId: string;

  queue: AsyncWorkerQueue<ITaskWorkload>;

  @Inject(Cache.NAME)
  cache: Cache;

  @Inject(TaskRunnerRegistry.NAME)
  taskRunnerRegistry: TaskRunnerRegistry;

  logger: ILoggerApi = Log.getLoggerFor(TaskQueueWorker);


  async prepare(options: ITaskQueueWorkerOptions = { name: 'task_worker_queue' }) {
    if (this.queue) {
      // already prepared
      return;
    }

    this.nodeId = Bootstrap.getNodeId();
    this.queue = new AsyncWorkerQueue<ITaskWorkload>(this, {
      logger: this.logger,
      cache: this.cache,
      ...options
    });
    await EventBus.register(this);
    this.logger.debug('Task worker: waiting for tasks ...');
  }


  onNext() {
    // const usedMem = os.
    const mem = process.memoryUsage();
    this.logger.debug(
      `memory: heap = ${this.memStr(mem.heapUsed)} / ${this.memStr(mem.heapTotal)} ` +
      `| free = ${this.memStr(freemem())} | total = ${this.memStr(totalmem())} | rss = ${this.memStr(mem.rss)} ` +
      `| external = ${this.memStr(mem.external)}`
    );
  }

  memStr(mem: number){
    return (Math.round(mem / 1024 / 1024 * 100) / 100) + ' MB';
  }

  getTasksRegistry() {
    return this.taskRunnerRegistry.tasks;
  }

  @subscribe(TaskEvent)
  onTaskEvent(event: TaskEvent) {
    if (event.state !== 'proposed') {
      return null;
    }

    if (event.targetIds &&
      event.targetIds.length > 0 &&
      event.targetIds.indexOf(this.nodeId) === -1) {
      // not a task for me
      return null;
    }

    event.respId = this.nodeId;
    event.topic = 'data';

    let parameters: any = null;
    let taskNames = isArray(event.taskSpec) ? event.taskSpec : [event.taskSpec];


    // filter not allowed tasks
    taskNames = taskNames.filter(t => (isString(t) &&
      this.getTasksRegistry().access(t)) || (!isString(t) && this.getTasksRegistry().access(t.name)));
    if (!isEmpty(taskNames)) {

      // validate arguments
      const props = TasksHelper.getIncomingParameters(TasksHelper.getTaskNames(taskNames).map(t => this.getTasksRegistry().get(t)));
      if (props.length > 0) {
        parameters = event.parameters;
        const optional = [];
        for (const p of props) {
          if (!has(parameters, p.storingName) && !has(parameters, p.name)) {
            if (p.isOptional()) {

              optional.push(p.name);
            } else {
              event.state = 'request_error';
              event.errors.push(<IError>{
                context: 'required_parameter',
                data: {
                  required: p.name
                },
                message: 'The required value is not passed.'
              });
              this.logger.error('task worker: necessery parameter "' + p.name + '" for ' + JSON.stringify(taskNames) + ' not found');
            }
          }
        }
        if (optional.length > 0) {
          this.logger.warn(
            'task worker: optional parameters "' + optional.join(', ') + '" for ' + JSON.stringify(taskNames) + ' not found'
          );
        }
      }

      if (event.state === 'proposed') {
        event.state = 'enqueue';
      }

    } else {
      event.state = 'request_error';
      event.errors.push(<IError>{
        context: 'task_not_allowed',
        message: 'The task a not supported by this worker.'
      });
    }

    if (event.state === 'enqueue') {
      setTimeout(() =>
        this.queue.push({
          names: taskNames,
          parameters: parameters,
          event: event
        }), 10);
    }

    this.logger.debug('enqueue task event: ' + event.nodeId + '=>' + event.id);
    return this.fireState(event);
  }


  async do(workLoad: ITaskWorkload, queue?: AsyncWorkerQueue<any>): Promise<any> {
    const e = workLoad.event;
    let results: ITaskRunnerResult = null;
    const taskOptions = {
      id: e.id,
      callerId: e.nodeId,
      nodeId: this.nodeId,
      targetIds: e.targetIds,
      local: false
    };
    const runner = this.taskRunnerRegistry.createNewRunner(workLoad.names, taskOptions);
    runner.getReadStream().on('data', (x: any) => {
      e.topic = 'log';
      e.log = x.toString().split('\n').filter((x: string) => !isEmpty(x));
      this.fireState(e);
    });

    runner.on(TASKRUN_STATE_UPDATE, () => {
      e.topic = 'data';
      e.data = runner.collectStats();
      this.fireState(e);
    });

    e.state = 'started';
    e.topic = 'data';
    e.data = runner.collectStats();
    this.fireState(e);

    try {
      await runner.setIncomings(workLoad.parameters);

      e.state = 'running';
      results = await runner.run();
      e.state = 'stopped';
      e.topic = 'data';
      e.data = runner.collectStats();
      this.fireState(e);
    } catch (err) {
      e.state = 'errored';
      e.topic = 'data';
      e.errors.push({
        message: err.message,
        context: ClassUtils.getClassName(err)
      });
      runner.getLogger().error(err);
      this.fireState(e);
    } finally {
      await runner.finalize();
    }
    return results;
  }


  fireState(e: TaskEvent): TaskEvent {
    const _e = cloneDeep(e);
    _e.reqEventId = e.id;
    _e.respId = this.nodeId;
    _e.nodeId = this.nodeId;
    _e.targetIds = [e.nodeId];
    _e.topic === 'log' ? _e.data = null : _e.log = null;
    EventBus.postAndForget(_e);
    return _e;
  }


  statistic(): IWorkerStatisitic {
    const stats: IWorkerStatisitic = {
      stats: this.queue.status(),
      paused: this.queue.isPaused(),
      idle: this.queue.isIdle(),
      occupied: this.queue.isOccupied(),
      running: this.queue.isPaused()
    };

    return stats;
  }

  async finish() {
    await EventBus.unregister(this);
    this.logger.remove();
    this.queue.removeAllListeners();
  }
}
