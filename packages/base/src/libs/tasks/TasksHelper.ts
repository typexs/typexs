import * as _ from 'lodash';
import { Config } from '@allgemein/config';

import { TaskRef } from './TaskRef';
import { TaskExchangeRef } from './TaskExchangeRef';
import { ClassLoader, PlatformUtils } from '@allgemein/base';
import { ITaskRunnerOptions } from './ITaskRunnerOptions';
import { TaskRequestFactory } from './worker/TaskRequestFactory';
import { ITaskExectorOptions } from './ITaskExectorOptions';
import { CL_TASK_QUEUE_WORKER, CL_TASK_RUNNER_REGISTRY, K_CLS_TASKS, TASK_RUNNER_SPEC } from './Constants';
import { RuntimeLoader } from '../../base/RuntimeLoader';
import { Tasks } from './Tasks';
import { Log } from '../logging/Log';
import { TaskRunner } from './TaskRunner';
import { IWorkerInfo } from '../worker/IWorkerInfo';
import { System } from '../system/System';
import { Injector } from '../di/Injector';
import { DateUtils } from '../utils/DateUtils';
import { assign, clone, defaults, has, isString } from 'lodash';


export class TasksHelper {

  static getIncomingParameters(tasks: TaskRef[], withoutPassThrough: boolean = false): TaskExchangeRef[] {
    const incoming: TaskExchangeRef[] = [];
    tasks.map(t => {
      t.getIncomings().map(x => {
        incoming.push(x);
      });
      if (!withoutPassThrough) {
        t.getOutgoings().map(x => {
          _.remove(incoming, i => i.storingName === x.storingName);
        });
      }
    });
    return incoming;
  }


  static prepare(tasks: Tasks, loader: RuntimeLoader, hasWorker: boolean = false) {
    const klasses = loader.getClasses(K_CLS_TASKS);
    for (const klass of klasses) {
      const task = Reflect.construct(klass, []);
      if (!('name' in task) || !_.isFunction(task['exec'])) {
        throw new Error('task ' + klass + ' has no name');
      }
      tasks.addTask(klass, null, { worker: hasWorker });
    }
  }


  static async addClasses(tasks: Tasks, dir: string) {
    const klazzes = await ClassLoader.importClassesFromDirectoriesAsync([dir]);
    for (const klass of klazzes) {
      const task = Reflect.construct(klass, []);
      if (!('name' in task) || !_.isFunction(task['exec'])) {
        throw new Error('task ' + klass + ' has no name');
      }
      tasks.addTask(klass);
    }
  }


  static runner(tasks: Tasks, name: TASK_RUNNER_SPEC | TASK_RUNNER_SPEC[], options: ITaskRunnerOptions) {

    const getTaskName = (def: any) => {
      let taskName = null;
      if (_.isString(def)) {
        taskName = def;
      } else if (def.name) {
        taskName = def.name;
      } else {
        throw new Error('unknown def');
      }
      return taskName;
    };

    if (_.isArray(name)) {
      const names = [];
      for (let i = 0; i < name.length; i++) {
        const def = name[i];
        const taskName = getTaskName(def);
        if (!tasks.contains(taskName)) {
          throw new Error('task ' + taskName + ' not exists');
        }
        names.push(def);
      }
      return new TaskRunner(tasks, names, options);
    } else {
      const taskName = getTaskName(name);

      if (tasks.contains(taskName)) {
        return new TaskRunner(tasks, [name], options);
      }
    }
    throw new Error('task ' + name + ' not exists');
  }


  static getTaskLogFile(
    runnerId: string, nodeId: string, relative: boolean = false, options: { parseDate: boolean } = { parseDate: true }
  ) {
    options = defaults(options || { parseDate: true }, { parseDate: true });
    const appPath = Config.get('app.path', PlatformUtils.pathResolve('.'));
    let logdir =
      Config.get('tasks.logdir',
        Config.get('os.tmpdir', '/tmp')
      );

    if (options.parseDate) {
      const date = new Date();
      const regex = /%(\w+)/ig;
      let res = null;
      // eslint-disable-next-line no-cond-assign
      while (res = regex.exec(logdir)) {
        try {
          const part = DateUtils.format(res[1], date);
          logdir = logdir.replace(res[0], part);
        } catch (e) {

        }
      }
    }


    if (!relative && !PlatformUtils.isAbsolute(logdir)) {
      logdir = PlatformUtils.join(appPath, logdir);
    } else if (relative) {
      logdir = logdir.replace(appPath + '/', '');
    }

    if (!PlatformUtils.fileExist(logdir)) {
      PlatformUtils.mkdir(logdir);
    }

    return PlatformUtils.join(
      logdir,
      'taskmonitor-' + runnerId + '-' + nodeId + '.log'
    );
  }


  /**
   * Return task names from task specification
   *
   * @param taskSpec
   */
  static getTaskNames(taskSpec: TASK_RUNNER_SPEC[]) {
    return taskSpec.map(x => _.isString(x) ? x : x.name);
  }


  /**
   * Extract task relevant parameters from passed keys
   * @param argv
   */
  static extractOptions(argv: ITaskExectorOptions) {
    const keys: (keyof ITaskExectorOptions)[] = [
      'executionConcurrency',
      'skipRequiredThrow',
      'skipTargetCheck',
      'targetId',
      'targetIds',
      'isLocal',
      'waitForRemoteResults',
      'remote',
      'executeOnMultipleNodes',
      'randomRemoteNodeSelection',
      'timeout'
    ];

    const options = {};
    keys.map(x => {
      if (!_.isUndefined(argv[x])) {
        options[x] = argv[x];
        delete argv[x];
      }
    });
    return options;

  }

  /**
   * Helper analysing parameters and executes local or remote execution
   *
   * @Deprecated use TaskExecutor instead
   *
   * ```
   * const executor = Injector.create(TaskExecutor);
   * const running = await executor1
   *   .create(
   *      ['simple_task_running'],
   *      {},
   *      {
   *        executionConcurrency: 1,
   *        waitForRemoteResults: true,
   *        targetId: 'system_0',
   *        skipTargetCheck: true,
   *      })
   *   .run();
   * ```
   *
   * @param taskSpec
   * @param argv
   */
  static async exec(taskSpec: TASK_RUNNER_SPEC[], argv: ITaskExectorOptions) {
    // check nodes for tasks
    if (!_.isArray(taskSpec) || _.isEmpty(taskSpec)) {
      throw new Error('no task definition found');
    }

    const options: ITaskExectorOptions = this.extractOptions(argv);
    const taskNames = this.getTaskNames(taskSpec);
    const tasksReg: Tasks = Injector.get(Tasks.NAME);
    const tasks = tasksReg.getTasksByNames(taskNames);
    const targetId = _.get(options, 'targetId', null);
    let isLocal = _.get(options, 'isLocal', true);
    const isRemote = _.get(options, 'remote', false);
    const skipTargetCheck = _.get(options, 'skipTargetCheck', false);

    // check if concurrency is restricted
    if (options.executionConcurrency) {
      if (options.executionConcurrency !== 0) {
        const registry = Injector.get(CL_TASK_RUNNER_REGISTRY) as any;
        const counts = registry.getLocalTaskCounts(taskNames);
        if (!_.isEmpty(counts)) {
          const max = _.max(_.values(counts));
          if (max >= options.executionConcurrency) {
            Log.warn(`task command: maximal concurrent process of ${taskNames} reached (${max} < ${options.executionConcurrency}). `);
            return null;
          }
        }
      }
    }

    if (targetId === null && !isRemote) {
      isLocal = true;
    } else {
      isLocal = false;
    }

    const localPossible = _.uniq(taskNames).length === tasks.length;
    if (!isLocal) {
      Log.debug('task command: before request fire');
      const execReq = Injector.get(TaskRequestFactory).executeRequest();
      const results = await execReq.create(
        taskSpec,
        argv,
        {
          targetIds: targetId ? [targetId] : [],
          skipTargetCheck: skipTargetCheck
        }).run();
      Log.debug('task command: event enqueue results', results);
      return results;
    } else if (isLocal) {

      if (localPossible) {
        const runnerOptions: ITaskRunnerOptions = {
          parallel: 5,
          dryMode: _.get(argv, 'dry-outputMode', _.get(argv, 'dryMode', false)),
          local: true
        };

        const parameters = TasksHelper.getTaskParameters(argv);
        for (const _taskSpec of taskSpec) {
          const taskName = isString(_taskSpec) ? _taskSpec : _taskSpec.name;
          const taskRef = tasksReg.get(taskName);
          const taskParams = has(_taskSpec, 'incomings') ? _taskSpec['incomings'] : {};
          assign(taskParams, clone(parameters));

          // validate arguments
          const props = TasksHelper.getIncomingParameters([taskRef]);
          if (props.length > 0) {
            for (const p of props) {
              if (!_.has(taskParams, p.storingName) && !_.has(taskParams, p.name)) {
                if (p.isOptional()) {
                  Log.warn('task command: optional parameter "' + p.name + '" for ' + JSON.stringify(_taskSpec) + ' not found');
                } else {
                  if (_.has(argv, 'skipRequiredThrow') && argv.skipRequiredThrow) {
                    Log.warn('task command: required parameter "' + p.name + '" for ' + JSON.stringify(_taskSpec) + ' not found.');
                  } else {
                    throw new Error('The required value is not passed');
                  }
                }
              }
            }
          }

        }


        const runner = TasksHelper.runner(tasksReg, taskSpec, runnerOptions);
        await runner.setIncomings(parameters);
        try {
          return await runner.run();
        } catch (err) {
          Log.error(err);
        }
      } else {
        Log.error('There are no tasks: ' + taskSpec.join(', '));
      }
    }
    return null;
  }


  static getWorkerNodes(system: System) {
    return _.concat([], [system.node], system.nodes)
      .filter(n => {
        const x = _.find(n.contexts, c => c.context === 'workers');
        return _.get(x, 'workers', []).find((y: IWorkerInfo) => y.className === CL_TASK_QUEUE_WORKER);
      }).map(x => x.nodeId);

  }


  static getTaskParameters(argv: any = {}) {
    const parameters: any = {};
    _.keys(argv).map(k => {
      if (!/^_/.test(k)) {
        parameters[_.snakeCase(k)] = argv[k];
      }
    });
    return parameters;
  }

}
