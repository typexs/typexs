import { clone, defaults, get, isError, isString, isUndefined, keys, orderBy, set, snakeCase } from 'lodash';
import { EventEmitter } from 'events';
import { Tasks } from './Tasks';
import { TaskRun } from './TaskRun';
import {
  TASK_RUNNER_SPEC,
  TASK_STATE_PROPOSED,
  TASK_STATE_RUNNING,
  TASK_STATE_STARTED,
  TASK_STATE_STOPPED,
  TASK_STATES,
  TASKRUN_STATE_DONE,
  TASKRUN_STATE_FINISH_PROMISE,
  TASKRUN_STATE_FINISHED,
  TASKRUN_STATE_NEXT,
  TASKRUN_STATE_RUN,
  TASKRUN_STATE_UPDATE
} from './Constants';
import { ITaskRunnerResult } from './ITaskRunnerResult';
import { Bootstrap } from '../../Bootstrap';
import { Invoker } from '../../base/Invoker';
import { TasksHelper } from './TasksHelper';
import { ILoggerApi } from '../logging/ILoggerApi';
import { ITaskRunnerOptions } from './ITaskRunnerOptions';
import { CryptUtils } from '@allgemein/base';
import { TasksApi } from '../../api/Tasks.api';
import { TaskRunnerRegistry } from './TaskRunnerRegistry';
import { TaskRunnerEvent } from './TaskRunnerEvent';
import { EventBus } from '@allgemein/eventbus';
import { Injector } from '../di/Injector';
import { StreamLogger } from '../logging/StreamLogger';
import { DateUtils } from '../utils/DateUtils';

/**
 * Container for single or multiple task execution
 *
 * Events:
 *
 * - TASKRUN_STATE_FINISHED
 * - TASKRUN_STATE_NEXT
 * - TASKRUN_STATE_RUN
 * - TASKRUN_STATE_DONE
 *
 */
export class TaskRunner extends EventEmitter {

  static taskRunnerId = 0;

  nr: number = TaskRunner.taskRunnerId++;

  /**
   * Unique Task Id
   */
  id: string;

  event: TaskRunnerEvent;

  taskNrs = 0;

  $options: ITaskRunnerOptions;

  $registry: Tasks;

  $parallel: any;

  $dry_mode: any;

  $tasks: TaskRun[] = [];

  private todoNrs: number[] = [];

  private runningNrs: number[];

  private doneNrs: number[];

  $finished: any;

  $start: Date;

  $stop: Date;

  $duration: number;

  // eslint-disable-next-line @typescript-eslint/ban-types
  $finish: Function = null;

  $incoming: any = {};

  $outgoing: any = {};

  undeclaredIncomingNames: string[] = [];

  state: TASK_STATES = TASK_STATE_PROPOSED;

  private invoker: Invoker;

  private loggerName: string;

  private taskLogger: ILoggerApi;

  // writeStream: Writable;

  // readStream: Readable;


  constructor(
    registry: Tasks,
    names: TASK_RUNNER_SPEC[],
    options: ITaskRunnerOptions = null) {
    super();
    const nodeId = options && options.nodeId ? options.nodeId : Bootstrap.getNodeId();
    this.$options = options || <any>{};
    defaults(this.$options, <ITaskRunnerOptions>{
      nodeId: nodeId,
      targetIds: [nodeId],
      skipRegistryAddition: false,
      disableLogFile: false
    });
    this.invoker = Injector.get(Invoker.NAME);

    // id can be overwriten
    this.$start = new Date();

    const dateStr = DateUtils.format('YYYYMMDD-HHmmssSSS', this.$start);
    this.id = get(options, 'id', dateStr + '-' + CryptUtils.shorthash(names.join(';') + Math.random()).substr(1));

    this.$registry = registry;
    this.$parallel = this.$options['parallel'] || 5;
    this.$dry_mode = this.$options['dryMode'] || false;

    this.todoNrs = [];
    this.runningNrs = [];
    this.doneNrs = [];

    this.resolveDeps(names);
    this.$tasks = orderBy(this.$tasks, ['$weight', 1]);

    this.$finished = false;

    this.todoNrs = this.$tasks.map(x => x.nr);
    this.loggerName = 'task-runner-' + this.id;

    // this.initStreams();
    this.initTaskLogger();

    this.on(TASKRUN_STATE_FINISHED, this.finish.bind(this));
    this.on(TASKRUN_STATE_NEXT, this.next.bind(this));
    this.on(TASKRUN_STATE_RUN, this.taskRun.bind(this));
    this.on(TASKRUN_STATE_DONE, this.taskDone.bind(this));

    this.api().onInit(this);

    this.state = TASK_STATE_STARTED;

    // For compatibility reasons
    if (!this.$options.skipRegistryAddition) {
      try {
        const registry: TaskRunnerRegistry = Injector.get(TaskRunnerRegistry.NAME);
        registry.addLocalRunner(this);
      } catch (e) {
        this.getLogger().debug(`couldn't locally register task nr=${this.nr} id=${this.id}`);
      }
    }
    this.getLogger().info('execute tasks: ' + this.$tasks.map(t => t.taskRef().name).join(', '));
    this.fireStateEvent();
  }

  /**
   * Initialize streams for input and output communication with runnings tasks
   * @private
   */
  // private initStreams() {
  //   // eslint-disable-next-line @typescript-eslint/no-this-alias
  //   const self = this;
  //   this.readStream = new Readable({
  //     read(size: number) {
  //     }
  //   });
  //
  //   this.readStream.on('data', (chunk: any) => {
  //     console.log(chunk);
  //   });
  //
  //   const res = this.readStream.push('hallo');
  //   console.log(res);
  //
  //
  //   // this.writeStream = new Writable({
  //   //   write(chunk: any, encoding: any, next: any) {
  //   //     (<any>self.readStream).push(chunk, encoding);
  //   //     next();
  //   //   }
  //   // });
  //   //
  //   // this.readStream.pipe(this.writeStream);
  // }


  /**
   * Initialize task logger
   *
   * @private
   */
  private initTaskLogger() {
    const startDate = DateUtils.toISO(this.$start);
    this.taskLogger = new StreamLogger(
      this.loggerName,
      {
        emitter: this,
        enable: true,
        prefix: this.loggerName,
        force: true,
        parameters: {
          taskStart: startDate,
          taskId: this.id,
          taskNames: this.todoNrs.join('--')
        }
      }
    );
  }


  fireStateEvent() {
    if (!this.event) {
      this.event = new TaskRunnerEvent();
      this.event.id = this.id;
      this.event.nr = this.nr;
      this.event.nodeId = this.getOption('nodeId', 'unknown');
    }

    this.event.state = this.state;
    this.event.started = this.$start;
    this.event.stopped = this.$stop;
    this.event.taskNames = this.$tasks.map(x => x.getTaskName());
    this.event.running = this.$tasks.filter(x => this.runningNrs.includes(x.nr)).map(x => x.getTaskName());
    this.event.finished = this.$tasks.filter(x => this.doneNrs.includes(x.nr)).map(x => x.getTaskName());

    const event = clone(this.event);
    EventBus.postAndForget(event).catch(e => this.taskLogger.error(e));
    // setTimeout(() => {
    //   try {
    //     EventBus.postAndForget(event);
    //   } catch (e) {
    //     Log.error(e);
    //   }
    // }, 0);
  }


  getOption(key: string, defaultValue?: any) {
    return get(this.$options, key, defaultValue);
  }

  getId() {
    return this.id;
  }

  getOptions() {
    return this.$options;
  }


  taskInc() {
    return this.taskNrs++;
  }


  getLogger() {
    return this.taskLogger;
  }


  // getReadStream() {
  //   return this.readStream;
  // }

  // getWriteStream() {
  //   return this.writeStream;
  // }

  getTaskNames(): string[] {
    return this.$tasks.map(x => x.getTaskName());
  }

  /**
   * Get all incomings passed to runner
   */
  getIncomings() {
    return this.$incoming;
  }

  /**
   * Get all necassary incoming parameter
   *
   * @param itersect
   */
  getIncomingParameters(withoutPassThrough: boolean = false) {
    return TasksHelper.getIncomingParameters(this.$tasks.map(tr => tr.taskRef()), withoutPassThrough);
  }

  /**
   * Set incomings variables
   *
   * @param parameters
   */
  async setIncomings(parameters: any) {
    if (parameters) {
      const paramNames = keys(parameters);
      for (const paramName of paramNames) {
        await this.setIncoming(paramName, parameters[paramName]);
      }
    }
  }

  /**
   * Set incoming variables or if not declared pass to parameters
   *
   * @param key
   * @param value
   */
  async setIncoming(key: string, value: any) {
    const ref = this.getIncomingParameters().find(i => i.storingName === snakeCase(key));
    if (ref) {
      set(this.$incoming, ref.storingName, await ref.convert(value));
    } else {
      if (!this.$options.ignoreUndeclaredIncomings) {
        this.undeclaredIncomingNames.push(key);
        set(this.$incoming, key, value);
      } else {
        this.getLogger().warn('no declared incoming parameter found for ' + key);
      }
    }
  }

  /**
   * Return undeclared parameter names which are not part on incomings
   */
  getUndeclaredIncomingNames() {
    return this.undeclaredIncomingNames;
  }

  /**
   * Check if subtask or depending tasks are ready
   */
  selectNextTask() {
    for (const taskRun of this.$tasks) {
      if (taskRun.ready()) {
        return taskRun;
      }
    }
    return null;
  }


  resolveDeps(task_names: TASK_RUNNER_SPEC[], parent?: TaskRun, variant?: 'subs' | 'deps') {
    for (let i = 0; i < task_names.length; i++) {
      const name = task_names[i];
      const taskRun = isString(name) ?
        this.createTaskRun(name) :
        this.createTaskRun(name.name, name.incomings);

      if (parent) {
        if (variant === 'deps') {
          parent.dependencyTaskNrs.push(taskRun.nr);
        } else if (variant === 'subs') {
          parent.subTaskNrs.push(taskRun.nr);
        }
      }
    }
  }


  createTaskRun(name: string, incomings: any = {}) {
    const task = this.$registry.get(name);
    const taskRun = new TaskRun(this, task, incomings);
    this.$tasks.push(taskRun);

    if (taskRun.subTaskNames.length > 0) {
      taskRun.addWeight(taskRun.subTaskNames.length);
      const subTaskNames = taskRun.subTaskNames.filter(tn => !this.$tasks.find(t => t.taskRef().name === tn));
      if (subTaskNames) {
        this.resolveDeps(taskRun.subTaskNames, taskRun, 'subs');
      }
    }

    if (taskRun.dependencyTaskNames.length > 0) {
      taskRun.addWeight(taskRun.dependencyTaskNames.length);
      const dependencyTaskNames = taskRun.dependencyTaskNames.filter(tn => !this.$tasks.find(t => t.taskRef().name === tn));
      if (dependencyTaskNames) {
        this.resolveDeps(taskRun.dependencyTaskNames, taskRun, 'deps');
      }
    }
    return taskRun;
  }


  enqueue(taskRun: TaskRun) {
    this.getLogger().debug('enqueue task at runtime ' + taskRun.taskRef().name);
    this.todoNrs.push(taskRun.nr);
    this.next();
  }


  areTasksDone(tasksNrs: number[]) {
    for (let i = 0; i < tasksNrs.length; i++) {
      const tName = tasksNrs[i];
      if (this.doneNrs.indexOf(tName) === -1) {
        // not done
        return false;
      }
    }
    return true;
  }


  next() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    if (this.$finished) {
      return;
    }

    if (this.todoNrs.length === 0 && this.runningNrs.length === 0) {
      this.$finished = true;
      self.emit(TASKRUN_STATE_FINISHED);
      return;
    }

    const nextTask = this.selectNextTask();
    this.state = TASK_STATE_RUNNING;
    if (this.runningNrs.length === 0 && !nextTask) {
      throw new Error('Tasks are stucked!');
    }

    if (nextTask) {
      if (this.runningNrs.length < this.$parallel) {
        self.emit(TASKRUN_STATE_RUN, nextTask);
      }
    }
  }


  api() {
    return this.invoker.use(TasksApi);
  }


  taskRun(taskRun: TaskRun) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const nr = taskRun.nr; // taskRef().name;

    const ridx = this.runningNrs.indexOf(nr);
    if (ridx === -1) {
      this.runningNrs.push(nr);
    } else {
      throw new Error('TaskRef already running!!!');
    }

    const idx = this.todoNrs.indexOf(nr);
    if (idx === -1) {
      throw new Error('TaskRef not in todo list!');
    }
    this.todoNrs.splice(idx, 1);

    const doneCallback = function(err: Error, res: any) {
      if (err) {
        self.taskLogger.error(err.stack);
      }
      taskRun.error(err);
      taskRun.result(res);
      self.emit(TASKRUN_STATE_DONE, taskRun, err);
    };

    const incoming: any = {};
    taskRun.taskRef().getIncomings().forEach(x => {
      if (!isUndefined(this.$incoming[x.storingName]) || !isUndefined(this.$outgoing[x.storingName])) {
        incoming[x.name] = this.$incoming[x.storingName] || this.$outgoing[x.storingName];
      } else if (x.hasOption('default')) {
        incoming[x.name] = x.getOptions('default', undefined);
      }
    });

    this.fireStateEvent();
    taskRun.start(doneCallback, incoming);
    self.emit(TASKRUN_STATE_NEXT);
  }


  taskDone(taskRun: TaskRun, err: Error = null) {
    taskRun.stop();

    // copy outgoings to incomings
    taskRun.taskRef().getOutgoings().forEach(x => {
      this.$outgoing[x.storingName] = taskRun.status.outgoing[x.name];
    });

    const nr = taskRun.nr;

    const ridx = this.doneNrs.indexOf(nr);
    if (ridx === -1) {
      this.doneNrs.push(nr);
    } else {
      throw new Error('TaskRef already in done list!!!');
    }

    const idx = this.runningNrs.indexOf(nr);
    if (idx === -1) {
      throw new Error('TaskRef not in running list!');
    }
    this.runningNrs.splice(idx, 1);

    if (err) {
      taskRun.error(err);
    }

    this.fireStateEvent();
    this.emit(TASKRUN_STATE_NEXT);
  }


  // eslint-disable-next-line @typescript-eslint/ban-types
  async run(cb?: Function): Promise<ITaskRunnerResult> {
    this.$finish = cb;

    this.api().onBefore(this);

    return new Promise((resolve, reject) => {
      // TODO timeout?
      this.once(TASKRUN_STATE_FINISH_PROMISE, (x: any) => {
        if (isError(x)) {
          this.api().onError(this);
          reject(x);
        } else {
          this.api().onAfter(this);
          resolve(x);
        }
      });

      this.emit(TASKRUN_STATE_NEXT);
    });
  }


  // eslint-disable-next-line @typescript-eslint/ban-types
  runDry(cb?: Function): Promise<ITaskRunnerResult> {
    this.$dry_mode = true;
    this.$finish = cb;
    return new Promise((resolve, reject) => {
      // TODO timeout?
      this.once(TASKRUN_STATE_FINISH_PROMISE, (x: any) => {
        if (isError(x)) {
          reject(x);
        } else {
          resolve(x);
        }
      });
      this.emit(TASKRUN_STATE_NEXT);
    });
  }


  getList() {
    return this.$tasks.map(t => t.taskRef().name);
  }

  update(taskName: string) {
    this.emit(TASKRUN_STATE_UPDATE, taskName, this.collectStats());
  }


  finish() {
    this.state = TASK_STATE_STOPPED;
    this.$stop = new Date();
    this.$duration = this.$stop.getTime() - this.$start.getTime();
    const status = this.collectStats();

    if (this.$finish) {
      this.$finish(status);
      this.$finish = null;
    }
    this.getLogger().close();

    // this.writeStream.end();
    // if (this.writeStream) {
    //   this.writeStream.destroy();
    // }
    this.fireStateEvent();
    this.emit(TASKRUN_STATE_FINISH_PROMISE, status);
  }


  collectStats(taskName: string = null): ITaskRunnerResult {
    // todo collect results
    const results = [];
    for (const task of this.$tasks) {
      results.push(task.stats());
    }

    const status: ITaskRunnerResult = {
      id: this.id,
      state: this.state,
      callerId: this.$options.callerId,
      nodeId: Bootstrap.getNodeId(),
      targetIds: this.$options.targetIds,
      start: this.$start,
      stop: this.$stop,
      duration: this.$duration,
      tasks: this.getList(),
      results: results
    };
    return status;
  }


  async finalize() {
    // TODO ...
    if (this.taskLogger) {
      // this.taskLogger.close();
      this.taskLogger = null;
    }

    // if (this.writeStream) {
    //   this.writeStream.removeAllListeners();
    //   // this.writeStream.destroy();
    //   this.writeStream = null;
    // }
    // if (this.readStream) {
    //   this.readStream.push(null);
    //   this.readStream.destroy();
    //   this.readStream.removeAllListeners();
    //   // this.readStream.destroy();
    //   this.readStream = null;
    // }

    this.removeAllListeners();
    this.event = null;
    this.$registry = null;
    this.$tasks = null;
  }

}

