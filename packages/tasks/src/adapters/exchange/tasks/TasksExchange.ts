import { NotYetImplementedError, PlatformUtils } from '@allgemein/base';
import { Config } from '@allgemein/config';
import {
  AbstractExchange,
  C_STORAGE_DEFAULT,
  CFG_KEY_APP_PATH,
  FileSystemExchange,
  FileSystemRequest,
  FileSystemResponse,
  IFileOptions,
  IFileSelectOptions,
  IMessageOptions,
  Injector,
  StorageRef
} from '@typexs/base';
import { TasksRequest } from './TasksRequest';
import { TasksResponse } from './TasksResponse';
import { TasksHelper } from '../../../lib/TasksHelper';
import { TaskRunnerRegistry } from '../../../lib/TaskRunnerRegistry';
import { Inject } from 'typedi';
import { TaskLog } from '../../../entities/TaskLog';
import { clone, get } from '@typexs/generic';


export class TasksExchange extends AbstractExchange<TasksRequest, TasksResponse> {

  @Inject('TaskRunnerRegistry')
  runnerRegistry: TaskRunnerRegistry;

  constructor() {
    super(TasksRequest, TasksResponse);
  }


  /**
   * Get log file path to fetch file content over FileSystemHandle
   *
   * @param runnerId
   * @param opts
   */
  getLogFilePath(runnerId: string, opts: IMessageOptions & { relative?: boolean } = {}) {
    const req = new TasksRequest();
    req.op = 'logfile_path';
    req.runnerId = runnerId;
    req.relative = get(opts, 'relative', false);
    const msg = this.create(opts);
    return msg.send(req);
  }

  /**
   * Get log file content
   *
   * @param runnerId
   * @param opts
   */
  getLogFile(runnerId: string, opts: IFileSelectOptions = {}) {
    const req = new TasksRequest();
    req.op = 'logfile';
    req.runnerId = runnerId;
    req.fileOptions = opts;
    const msg = this.create(opts);
    return msg.send(req);
  }

  /**
   * Get status information of a running task
   *
   * @param runnerId
   * @param opts
   */
  getStatus(runnerId: string, opts: IMessageOptions = {}) {
    const req = new TasksRequest();
    req.op = 'status';
    req.runnerId = runnerId;
    const msg = this.create(opts);
    return msg.send(req);
  }

  /**
   * Get current running runners
   *
   * @param opts
   */
  getRunners(opts: IMessageOptions = {}) {
    const req = new TasksRequest();
    req.op = 'runners';
    const msg = this.create(opts);
    return msg.send(req);
  }

  /**
   * Get current running runners
   *
   * @param opts
   */
  getRunningTasks(opts: IMessageOptions = {}) {
    const req = new TasksRequest();
    req.op = 'running_tasks';
    const msg = this.create(opts);
    return msg.send(req);
  }

  // /**
  //  * TODO start a task
  //  *
  //  * @param opts
  //  */
  // start() {
  // }
  //
  // /**
  //  * TODO stop a task
  //  *
  //  * @param opts
  //  */
  // stop() {
  // }
  //
  // /**
  //  * TODO pause a task (if possible)
  //  *
  //  * @param opts
  //  */
  // pause() {
  // }
  //
  // /**
  //  * TODO resume a task (if possible)
  //  *
  //  * @param opts
  //  */
  // resume() {
  // }

  async handleRequest(request: TasksRequest, response: TasksResponse) {
    response.op = request.op;
    try {
      let logFilePath2, fsExchange, opts: IFileOptions, res, req, logFilePath, storageRef, runners;
      // todo get current running tasks
      switch (request.op) {
        case 'logfile':
          // get log path
          logFilePath2 = TasksHelper.getTaskLogFile(request.runnerId, this.getSystem().node.nodeId, true);
          // use fs exchange
          fsExchange = Injector.get(FileSystemExchange);
          opts = clone(request.fileOptions) as IFileOptions;
          opts.path = logFilePath2;
          req = new FileSystemRequest(opts);
          res = new FileSystemResponse();
          await fsExchange.handleRequest(req, res);
          if (res.error) {
            throw res.error;
          } else {
            if (res.data) {
              response.logFileContent = res.data.toString();
            } else {
              response.logFileContent = '';
            }
          }
          break;

        case 'logfile_path':
          // get log path
          logFilePath = TasksHelper.getTaskLogFile(request.runnerId, this.getSystem().node.nodeId, request.relative);
          if (!request.relative && PlatformUtils.fileExist(logFilePath)) {
            response.logFilePath = logFilePath;
          } else if (request.relative && PlatformUtils.fileExist(Config.get(CFG_KEY_APP_PATH) + '/' + logFilePath)) {
            response.logFilePath = logFilePath;
          } else if (request.relative && PlatformUtils.fileExist(logFilePath)) {
            response.logFilePath = logFilePath;
          } else {
            throw new Error(`file for runner ${request.runnerId} not found`);
          }
          break;

        case 'status':
          // get log path
          storageRef = Injector.get(C_STORAGE_DEFAULT) as StorageRef;
          response.taskLog = await storageRef.getController().findOne(TaskLog, { tasksId: request.runnerId }, { cache: false });
          break;

        case 'runners':
          runners = this.runnerRegistry.getRunners();
          response.stats = runners.map(x => x.collectStats());
          break;

        case 'running_tasks':
          response.runningStatuses = await this.runnerRegistry.getRunningTasks();
          break;

        case 'start':
          throw new NotYetImplementedError();

        case 'stop':
          throw new NotYetImplementedError();

        default:
          throw new NotYetImplementedError();

      }
    } catch (e) {
      this.logger.error(e);
      response.error = e;
    }
  }


  handleResponse(responses: TasksResponse) {
    switch (responses.op) {
      case 'logfile_path':
        return responses.logFilePath;
      case 'logfile':
        return responses.logFileContent;
      case 'runners':
        return responses.stats;
      case 'running_tasks':
        return responses.runningStatuses;
      case 'status':
        return responses.taskLog;
      default:
        throw new NotYetImplementedError();
    }
  }
}


