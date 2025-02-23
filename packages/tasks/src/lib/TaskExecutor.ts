import { Inject } from 'typedi';
import { Tasks } from './Tasks';
import { TaskRunnerRegistry } from './TaskRunnerRegistry';
import { TASK_RUNNER_SPEC, TASK_STATE_REQUEST_ERROR } from './Constants';
import { ITaskExectorOptions } from './ITaskExectorOptions';
import { Bootstrap, IError, ILoggerApi, Log } from '@typexs/base';
import { TaskRequestFactory } from './worker/TaskRequestFactory';
import { TasksHelper } from './TasksHelper';
import { EventEmitter } from 'events';
import { ITaskRunnerOptions } from './ITaskRunnerOptions';
import { EventBus, subscribe, unsubscribe } from '@allgemein/eventbus';
import { TaskFuture } from './worker/execute/TaskFuture';
import { ITaskRunnerResult } from './ITaskRunnerResult';
import { TaskEvent } from './event/TaskEvent';
import { clone, defaults, get, isArray, isEmpty, isUndefined, max, uniq, values } from '@typexs/generic';


/**
 * Class controlling local or remote tasks execution.
 *
 * Initialize by
 * ```
 * const executor = Injector.create(TaskExecutor);
 * ```
 *
 * Tasks can be called by name or by task specs.
 *
 */

const DEFAULT_TASK_EXEC: ITaskExectorOptions = {
  skipTargetCheck: false,
  executionConcurrency: null,
  skipRequiredThrow: false,
  skipThrow: false,
  targetId: null,
  targetIds: null,
  isLocal: true,
  remote: false,
  executeOnMultipleNodes: 1,
  randomRemoteNodeSelection: true,
  waitForRemoteResults: true,
  timeout: 5000
};

const TASK_PREFIX = 'task_done_';

// TODO Arguments from incoming!!!
export class TaskExecutor extends EventEmitter {

  private executeable: boolean = true;

  private options: ITaskExectorOptions;

  private passedOptions: ITaskExectorOptions = {};

  private params: any;

  private spec: TASK_RUNNER_SPEC[];

  private taskNames: string[];

  private targetIds: string[];


  @Inject(Tasks.NAME)
  tasks: Tasks;

  @Inject(TaskRunnerRegistry.NAME)
  taskRunnerRegistry: TaskRunnerRegistry;

  @Inject(() => TaskRequestFactory)
  requestFactory: TaskRequestFactory;

  constructor() {
    super();
  }

  logger: ILoggerApi = Log.getLoggerFor(TaskExecutor);

  setOptions(options: ITaskExectorOptions) {
    const _opts = options || { skipTargetCheck: false };
    this.passedOptions = clone(_opts);
    this.options = _opts;
    defaults(this.options, DEFAULT_TASK_EXEC);
  }

  /**
   * Executeable
   */
  isExecuteable() {
    return this.executeable;
  }

  /**
   * Initialize the task executor
   *
   * @param taskSpec
   * @param _argv
   */
  create(taskSpec: TASK_RUNNER_SPEC[], param: any = {}, _argv: ITaskExectorOptions) {
    // check nodes for tasks
    if (!isArray(taskSpec) || isEmpty(taskSpec)) {
      throw new Error('no task definition found');
    }
    this.params = param;

    this.spec = taskSpec;
    this.setOptions(_argv);

    this.taskNames = TasksHelper.getTaskNames(taskSpec);


    if (this.options.targetId && !this.options.remote) {
      this.targetIds = [this.options.targetId];
      this.options.isLocal = false;
      this.options.remote = true;
    } else if (this.options.targetIds && !this.options.remote) {
      this.targetIds = this.options.targetIds;
      this.options.isLocal = false;
      this.options.remote = true;
    } else if (this.options.remote) {
      this.options.isLocal = false;
    } else {

      const nodeId = Bootstrap.getNodeId();
      const tasks = this.tasks.getTasksByNames(this.taskNames);
      if (isUndefined(this.passedOptions.isLocal)) {
        // when isLocal is not set manuell
        this.options.remote = false;
        this.options.isLocal = true;
        const taskRef = tasks.find(x => !!x.nodeInfos.find(x => x.nodeId === nodeId));
        if (taskRef) {
          // found local reference look if
          const taskRefNodeInfo = taskRef.nodeInfos.find(x => x.nodeId === nodeId);
          if (taskRefNodeInfo && taskRefNodeInfo.hasWorker) {
            // local worker is running
            this.options.isLocal = false;
            this.targetIds = [nodeId];
          }
        } else {
          // try remote lookup
          this.options.remote = true;
          this.options.isLocal = false;
        }
      } else {
        this.options.remote = false;
        this.options.isLocal = true;
      }
    }


    if (this.options.executionConcurrency) {
      if (this.options.executionConcurrency !== 0) {

        const counts = this.options.isLocal ?
          this.taskRunnerRegistry.getLocalTaskCounts(this.taskNames) :
          this.taskRunnerRegistry.getGlobalTaskCounts(this.taskNames)
        ;
        if (!isEmpty(counts)) {
          const _max = max(values(counts));
          if (_max >= this.options.executionConcurrency) {
            this.logger.warn(
              'task command: ' +
              `maximal concurrent process of ${this.taskNames} reached (${_max} < ${this.options.executionConcurrency}).`);
            this.executeable = false;
          }
        }
      }
    }

    return this;
  }

  /**
   * Tells if the task will be executed locally, can be used after "create" method
   */
  isLocally() {
    return this.options.isLocal;
  }

  /**
   * Return all options for this task execution
   */
  getOptions() {
    return this.options;
  }

  async run(asFuture: boolean = false): Promise<ITaskRunnerResult | ITaskRunnerResult[] | TaskFuture | TaskEvent[]> {
    if (!this.executeable) {
      return null;
    }
    if (!this.options.isLocal) {
      return this.executeOnWorker(asFuture);
    } else {
      return this.executeLocally();
    }
  }

  /**
   * Task will be executed locally
   */
  async executeLocally() {
    const tasks = this.tasks.getTasksByNames(this.taskNames);
    const localPossible = uniq(this.taskNames).length === tasks.length;

    if (localPossible) {
      const options: ITaskRunnerOptions = {
        parallel: 5,
        dryMode: get(this.options, 'dry-outputMode', false),
        local: true
      };

      const parameters = TasksHelper.getTaskParameters(this.params);
      const runner = TasksHelper.runner(this.tasks, this.spec, options);
      await runner.setIncomings(parameters);
      return runner.run();
    } else {
      this.logger.error('There are no tasks: ' + this.spec.join(', '));
    }
    return null;
  }


  async executeOnWorker(asFuture: boolean = false) {
    this.logger.debug(this.taskNames + ' before request fire');
    let executeRequest = this.requestFactory.executeRequest();
    const options = clone(this.options);
    if (this.targetIds) {
      options.targetIds = this.targetIds;
    }
    executeRequest = executeRequest.create(
      this.spec,
      this.params,
      options
    );
    let future: TaskFuture = null;
    if (this.options.waitForRemoteResults) {
      future = await executeRequest.future();
    }

    const enqueueEvents = await executeRequest.run();
    if (enqueueEvents && enqueueEvents.length === 0) {
      // ERROR!!! NO RESPONSE
      if (!options.skipThrow) {
        throw new Error('No enqueue responses arrived');
      } else {
        // this.logger.warn(
        //   'Skipping throw enabled, so do not throw ' +
        //   '"no enqueue response arrived. Probably no ExchangeMessageWorker missing"'
        // );
        return null;
      }
    } else if (enqueueEvents && enqueueEvents.length > 0) {
      if (enqueueEvents[0].state === TASK_STATE_REQUEST_ERROR) {
        if (isArray(enqueueEvents[0].errors) && enqueueEvents[0].errors.length > 0) {
          if (future) {
            await future.close();
          }
          if (!options.skipThrow) {
            enqueueEvents[0].errors.forEach((x: IError) => {
              throw new Error(x.message + '' + (x.data ? ' data: ' + JSON.stringify(x.data) : ''));
            });
          }
          return enqueueEvents;
        }


      }
    }

    if (future) {
      if (asFuture) {
        return future;
      }
      return future.await();
    }
    return enqueueEvents;
  }


  async register() {
    if (this.options.waitForRemoteResults) {
      subscribe(TaskEvent)(this, 'onTaskEvent');
      await EventBus.register(this);
    }
  }

  async unregister() {
    try {
      await EventBus.unregister(this);
      unsubscribe(this, TaskEvent, 'onTaskEvent');
    } catch (e) {

    }
  }
}
