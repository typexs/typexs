/**
 * Registers all running tasks in the local node
 */
import * as _ from 'lodash';
import { isEmpty, keys, remove, values } from 'lodash';
import { Inject } from 'typedi';
import { EventBus, subscribe } from 'commons-eventbus';
import { TaskRunner } from './TaskRunner';
import { CL_TASK_RUNNER_REGISTRY, TASK_RUNNER_SPEC, TASKRUN_STATE_FINISH_PROMISE } from './Constants';
import { Counters } from '../helper/Counters';
import { ITaskRunnerOptions } from './ITaskRunnerOptions';
import { Tasks } from './Tasks';
import { TaskRunnerEvent } from './TaskRunnerEvent';
import { ITaskRunnerStatus } from './ITaskRunnerStatus';
import { SystemNodeInfo } from '../../entities/SystemNodeInfo';
import { CacheArray } from '../queue/CacheArray';
import { DefaultArray } from '../queue/DefaultArray';
import { Cache } from '../cache/Cache';
import { IQueueArray } from '../queue/IQueueArray';
import { Injector } from '../di/Injector';

/**
 * Node specific registry for TaskRunner which is initalized as singleton in Activator.
 */
export class TaskRunnerRegistry {

  public static NAME = CL_TASK_RUNNER_REGISTRY;

  cache: Cache;

  @Inject(Tasks.NAME)
  tasks: Tasks;

  private intervalId: any;

  private localTaskRunner: TaskRunner[] = [];

  private systemwideTaskStatus: IQueueArray<TaskRunnerEvent>;

  private taskNames: { [id: string]: { taskNames: string[]; ts: number } } = {};

  async onStartup() {
    try {
      this.cache = Injector.get(Cache.NAME) as Cache;
    } catch (e) {

    }
    if (this.cache) {
      // this.worker = new CacheArray(this.options.cache, QueueJob);
      this.systemwideTaskStatus = new CacheArray(this.cache, TaskRunnerEvent);
    } else {
      // this.worker = new DefaultArray<QueueJob<T>>();
      this.systemwideTaskStatus = new DefaultArray<TaskRunnerEvent>();
    }

    this.intervalId = setInterval(this.cleanup.bind(this), 30 * 60 * 1000);
    await EventBus.register(this);
  }

  async onShutdown() {
    clearInterval(this.intervalId);
    await EventBus.unregister(this);
  }

  @subscribe(TaskRunnerEvent)
  async onTaskRunnerEvent(event: TaskRunnerEvent) {
    // Log.debug('task runner event: ' + event.state + ' ' + event.id + ' ' + event.nodeId);
    if (['stopped', 'errored', 'request_error'].includes(event.state)) {
      await this.removeTaskStatus(event.id);
    } else {
      await this.addTaskStatus(event);
    }
  }

  /**
   * Cleanup registry for old values
   */
  async cleanup() {
    let remove = await this.systemwideTaskStatus.filter(
      (x: TaskRunnerEvent) => ['stopped', 'errored', 'request_error'].includes(x.state));
    if (!isEmpty(remove)) {
      await Promise.all(remove.map((x: TaskRunnerEvent) => this.removeTaskStatus(x.id)));
    }
    // 4 hours
    const longestTask = 4 * 60 * 60 * 1000;
    remove = keys(this.taskNames).filter(k => longestTask < Date.now() - this.taskNames[k].ts);
    if (!isEmpty(remove)) {
      await Promise.all(remove.map((x: string) => this.removeTaskStatus(x)));
    }
  }

  /**
   * Called by TaskSystemExtension
   *
   * @param nodeInfo
   */
  async onNodeUpdate(nodeInfo: SystemNodeInfo) {
    if (nodeInfo.state === 'register' || nodeInfo.state === 'unregister') {
      const toremove = (await this.systemwideTaskStatus.filter(x => x.nodeId === nodeInfo.nodeId));
      if (toremove.length > 0) {
        await Promise.all(toremove.map(x => this.removeTaskStatus(x.id)));
      }
    }
  }


  /**
   * Add a runner mostly on startup
   */
  addLocalRunner(runner: TaskRunner) {
    const runnerId = runner.id;
    if (!this.localTaskRunner.find(x => x.id === runnerId)) {
      this.taskNames[runner.id] = { taskNames: runner.getTaskNames(), ts: (Date.now()) };
      this.localTaskRunner.push(runner);
      runner.once(TASKRUN_STATE_FINISH_PROMISE, () => {
        this.removeLocalRunner(runnerId);
      });
    }
  }


  removeLocalRunner(runnerId: string) {
    delete this.taskNames[runnerId];
    remove(this.localTaskRunner, x => x.id === runnerId);
  }

  addTaskStatus(r: TaskRunnerEvent) {
    this.taskNames[r.id] = { taskNames: r.taskNames, ts: (Date.now()) };
    return this.systemwideTaskStatus.set(r);
  }

  removeTaskStatus(runnerId: string) {
    this.systemwideTaskStatus.remove(runnerId);
    delete this.taskNames[runnerId];
  }

  /**
   * Create new runner
   *
   * @param names
   * @param options
   */
  createNewRunner(names: TASK_RUNNER_SPEC[], options: ITaskRunnerOptions = null) {
    options.skipRegistryAddition = true;
    const runner = new TaskRunner(this.tasks, names, options);
    this.addLocalRunner(runner);
    return runner;
  }


  /**
   * Check if tasks with name or names are running
   */
  hasRunnerForTasks(taskNames: string | string[]) {
    if (_.isString(taskNames)) {
      taskNames = [taskNames];
    }
    const intersect = _.intersection(taskNames, _.concat([], ...this.localTaskRunner.map(x => x.getTaskNames())));
    return intersect.length === taskNames.length;
  }


  /**
   * Check if tasks with name or names are running
   */
  hasRunningTasks(taskNames: string | string[]) {
    if (_.isString(taskNames)) {
      taskNames = [taskNames];
    }
    const intersect = _.intersection(taskNames, _.concat([], ...(values(this.taskNames)).map(x => x.taskNames)));
    return intersect.length === taskNames.length;
  }


  /**
   * Returns the currently running runnerIds with the taskNames
   */
  async getRunningTasks(): Promise<ITaskRunnerStatus[]> {
    const copy = await this.systemwideTaskStatus.map(x => x);
    return copy;
  }

  /**
   * Count local active tasks
   *
   * @param taskNames
   */
  getLocalTaskCounts(taskNames: string | string[]) {
    if (_.isString(taskNames)) {
      taskNames = [taskNames];
    }
    const counters = new Counters();
    this.localTaskRunner.forEach(x => {
      x.getTaskNames().filter(y => taskNames.includes(y)).forEach(y => counters.get(y).inc());
    });
    return counters.asObject();
  }

  /**
   * Count local active tasks
   *
   * @param taskNames
   */
  getGlobalTaskCounts(taskNames: string | string[]) {
    if (_.isString(taskNames)) {
      taskNames = [taskNames];
    }
    const counters = new Counters();
    values(this.taskNames).map(x => {
      x.taskNames.filter((y: string) => taskNames.includes(y)).forEach((y: string) => counters.get(y).inc());
    });
    return counters.asObject();
  }

  /**
   * Return the runners variable
   */
  getRunners() {
    return this.localTaskRunner;
  }


}
