import { Get, HttpError, InternalServerError, JsonController, Param, QueryParam } from 'routing-controllers';
import { concat, get, isArray, isEmpty, isFunction, snakeCase } from '@typexs/generic';
import { Cache, IError, IFileSelectOptions, IMessageOptions, Inject, Injector, Invoker } from '@typexs/base';
import {
  _API_CTRL_TASK_EXEC,
  _API_CTRL_TASK_GET_METADATA,
  _API_CTRL_TASK_GET_METADATA_VALUE,
  _API_CTRL_TASK_LOG,
  _API_CTRL_TASK_STATUS,
  _API_CTRL_TASKS,
  _API_CTRL_TASKS_METADATA,
  _API_CTRL_TASKS_RUNNERS_INFO,
  _API_CTRL_TASKS_RUNNING,
  _API_CTRL_TASKS_RUNNING_ON_NODE,
  PERMISSION_ALLOW_TASK_EXEC,
  PERMISSION_ALLOW_TASK_EXEC_PATTERN,
  PERMISSION_ALLOW_TASK_GET_METADATA,
  PERMISSION_ALLOW_TASK_GET_METADATA_PATTERN,
  PERMISSION_ALLOW_TASK_LOG,
  PERMISSION_ALLOW_TASK_RUNNER_INFO_VIEW,
  PERMISSION_ALLOW_TASK_STATUS,
  PERMISSION_ALLOW_TASKS_METADATA,
  PERMISSION_ALLOW_TASKS_RUNNING
} from '../lib/Constants';
import { Access, C_API, ContextGroup, Helper } from '@typexs/server';
import { IJsonSchema7 } from '@allgemein/schema-api';
import { defaults, isNumber } from 'lodash';
import { Tasks } from '../lib/Tasks';
import { TaskRunnerRegistry } from '../lib/TaskRunnerRegistry';
import { TasksExchange } from '../adapters/exchange/tasks/TasksExchange';
import { TasksHelper } from '../lib/TasksHelper';
import { IValueProvider } from '../lib/decorators/IValueProvider';
import { ITaskExectorOptions } from '../lib/ITaskExectorOptions';
import { TaskExecutor } from '../lib/TaskExecutor';

@ContextGroup(C_API)
@JsonController(_API_CTRL_TASKS)
export class TasksAPIController {

  @Inject(Tasks.NAME)
  tasks: Tasks;

  @Inject(TaskRunnerRegistry.NAME)
  taskRunner: TaskRunnerRegistry;

  @Inject(Invoker.NAME)
  invoker: Invoker;

  @Inject(Cache.NAME)
  cache: Cache;

  @Inject(() => TasksExchange)
  taskExchange: TasksExchange;


  static getTaskLogFile(runnerId: string, nodeId: string) {
    return TasksHelper.getTaskLogFile(runnerId, nodeId);
  }

  // @Access(PERMISSION_ALLOW_TASKS_LIST)
  // @Get(_API_CTRL_TASKS_LIST)
  // list() {
  //   return this.tasks.infos(true);
  // }

  @Access(PERMISSION_ALLOW_TASKS_METADATA)
  @Get(_API_CTRL_TASKS_METADATA)
  async tasksMetadata(): Promise<any> {
    return this.tasks.toJsonSchema();
  }

  @Access([PERMISSION_ALLOW_TASK_GET_METADATA,
    PERMISSION_ALLOW_TASK_GET_METADATA_PATTERN])
  @Get(_API_CTRL_TASK_GET_METADATA)
  taskMetadata(@Param('taskName') taskName: string): IJsonSchema7 {
    if (this.tasks.contains(taskName)) {
      return this.tasks.get(taskName).toJsonSchema();
    }
    return {};
  }


  @Access([PERMISSION_ALLOW_TASK_GET_METADATA,
    PERMISSION_ALLOW_TASK_GET_METADATA_PATTERN])
  @Get(_API_CTRL_TASK_GET_METADATA_VALUE)
  taskMetadataValueProvider(@Param('taskName') taskName: string,
    @Param('incomingName') incomingName: string,
    @QueryParam('values') values: any = null,
    @QueryParam('hint') hint: any = null) {
    if (!this.tasks.contains(taskName)) {
      throw new HttpError(404, 'No task with this name found');
    }
    const snakeCaseIncoming = snakeCase(incomingName);
    const taskRef = this.tasks.get(taskName);
    const taskIncomingRef = taskRef.getIncomings().find(x => snakeCase(x.name) === snakeCaseIncoming);

    if (!taskIncomingRef) {
      throw new HttpError(404, 'No task incoming parameter with this name found');
    }

    const valueProvider = taskIncomingRef.getOptions('valueProvider');
    if (!valueProvider) {
      throw new HttpError(404, 'No value provider defined for task incoming parameter');
    }

    if (isFunction(valueProvider)) {
      if (valueProvider.prototype && valueProvider.prototype.constructor) {
        // is a class
        const providerInstance = <IValueProvider<any>>Injector.get(<any>valueProvider);
        return providerInstance.get(values, taskIncomingRef, hint);
      } else {
        // is a function
        return valueProvider(values, taskIncomingRef, hint);
      }
    } else {
      return valueProvider;
    }
  }


  /**
   * Execute a single task
   *
   * @param taskName
   * @param parameters
   * @param targetIds - depracated
   * @param options
   */
  @Access([PERMISSION_ALLOW_TASK_EXEC, PERMISSION_ALLOW_TASK_EXEC_PATTERN])
  @Get(_API_CTRL_TASK_EXEC)
  async executeTask(@Param('taskName') taskName: string,
    @QueryParam('params') parameters: any = {},
    @QueryParam('targetIds', { isArray: true }) targetIds: string[] = [],
    @QueryParam('options') options: ITaskExectorOptions = {}) {
    // arguments
    // const execReq = this.taskFactory.executeRequest();
    options = defaults(options, <ITaskExectorOptions>{
      waitForRemoteResults: false,
      skipTargetCheck: false
    });

    if (targetIds && isArray(targetIds) && targetIds.length > 0) {
      options.targetIds = targetIds;
    }

    // as start only
    try {
      const executor = Injector.create(TaskExecutor);
      const taskEvent: any[] = await executor
        .create(
          [taskName],
          parameters,
          options)
        .run() as any[];

      // check if error happened
      if (!get(options, 'skipThrow', false)) {
        if (taskEvent && isArray(taskEvent)) {

          let errors: IError[] = [];
          if (!get(options, 'waitForRemoteResults', false)) {
            errors = concat([], ...taskEvent.map(x => get(x, 'errors', [])));
          } else {
            errors = concat([], ...taskEvent.map(x => get(x, 'results', []).map((y: any) => y.error))).filter(x => !!x);
          }

          if (errors.length > 0) {
            throw new InternalServerError(errors.map(e => e.message
              + (e.data ? JSON.stringify(e.data) : '')).join('\n'));
          }
        }
      }

      return taskEvent;
    } catch (e) {
      throw new InternalServerError(e.message);
    }
  }

  //
  // TODO: Implement execution of multiple tasks
  //


  /**
   * Return the content of the logfile. There are two variants of selecting
   * the content first is by setting "from" with optional "offset" parameter which
   * causes to return the file content between given scale. When "tail" is set you
   * get the last lines passed.
   *
   * Default is 'tail' with 50 lines
   *
   * @param nodeId
   * @param runnerId
   * @param fromLine
   * @param offsetLine
   * @param number
   */
  @Access(PERMISSION_ALLOW_TASK_LOG)
  @Get(_API_CTRL_TASK_LOG)
  async getLogContent(
    @Param('nodeId') nodeId: string,
    @Param('runnerId') runnerId: string,
    @QueryParam('limit') limitLine: number = null,
    @QueryParam('offset') offsetLine: number = null,
    @QueryParam('tail') tail: number = null,
    @QueryParam('options') options: any = {}
  ) {

    let _opts = options || {};
    _opts = defaults(_opts, <IMessageOptions & IFileSelectOptions>{
      filterErrors: false,
      outputMode: 'only_value',
      targetIds: [nodeId],
      unit: 'line'
    });

    let less = false;
    if (isNumber(offsetLine)) {
      _opts.offset = offsetLine;
      less = true;
    }

    if (isNumber(limitLine)) {
      _opts.limit = limitLine;
      less = true;
    }

    if (less && isNumber(tail)) {
      _opts.tail = tail;
    } else if (!less) {
      _opts.tail = 50;
    }

    try {
      const responses = await this.taskExchange.getLogFile(runnerId, _opts);
      Helper.convertError(responses);
      return responses;
    } catch (e) {
      throw new InternalServerError(e.message);
    }
  }


  /**
   * Returns the status of a task runner by runner id
   *
   * @param runnerId
   * @param runnerId
   */
  @Access(PERMISSION_ALLOW_TASK_STATUS)
  @Get(_API_CTRL_TASK_STATUS)
  async getTaskStatus(
    @Param('runnerId') runnerId: string,
    @QueryParam('options') options: IMessageOptions = {}
  ) {
    let _opts = options || {};
    _opts = defaults(_opts, <IMessageOptions>{
      filterErrors: true,
      outputMode: 'only_value'
    });
    try {
      const status = await this.taskExchange.getStatus(runnerId, _opts);
      Helper.convertError(status);
      if (isArray(status) && _opts.outputMode === 'only_value') {
        return status.filter(x => !!x);
      }
      return status;
    } catch (e) {
      throw new InternalServerError(e.message);
    }

  }


  /**
   * Return the running tasks for node
   *
   * @param nodeId
   */
  @Access([PERMISSION_ALLOW_TASKS_RUNNING])
  @Get(_API_CTRL_TASKS_RUNNING_ON_NODE)
  async getRunningTasksByNode(@Param('nodeId') nodeId: string,
    @QueryParam('options') options: IMessageOptions = {}) {

    let _opts = options || {};
    _opts = defaults(_opts, <IMessageOptions>{
      filterErrors: true,
      outputMode: 'only_value',
      targetIds: [nodeId]
    });
    return this.getRunningTasks(_opts);
  }


  /**
   * Return the running tasks for node
   *
   * @param nodeId
   */
  @Access([PERMISSION_ALLOW_TASKS_RUNNING])
  @Get(_API_CTRL_TASKS_RUNNING)
  async getRunningTasks(@QueryParam('options') options: IMessageOptions = {}) {

    let _opts = options || {};
    _opts = defaults(_opts, <IMessageOptions>{
      filterErrors: true,
      outputMode: 'only_value'
    });
    try {
      const results = await this.taskExchange.getRunningTasks(_opts);
      Helper.convertError(results);
      if (isArray(results) && _opts.outputMode === 'only_value') {
        return concat([], ...results.filter(x => x && !isEmpty(x)));
      }
      return results;
    } catch (e) {
      throw new HttpError(404, e.message);
    }
  }


  /**
   * Return the running tasks for node
   *
   * @param nodeId
   */
  @Access([PERMISSION_ALLOW_TASK_RUNNER_INFO_VIEW])
  @Get(_API_CTRL_TASKS_RUNNERS_INFO)
  async getRunners(@QueryParam('options') options: IMessageOptions = {}) {

    let _opts = options || {};
    _opts = defaults(_opts, <IMessageOptions>{
      filterErrors: true,
      outputMode: 'only_value'
    });
    try {
      const results = await this.taskExchange.getRunners(_opts);
      Helper.convertError(results);
      if (isArray(results) && _opts.outputMode === 'only_value') {
        return concat([], ...results.filter(x => x && !isEmpty(x)));
      }
      return results;
    } catch (e) {
      throw new HttpError(404, e.message);
    }
  }


}
