// process.env.SQL_LOG = '1';
import { suite, test, timeout } from '@testdeck/mocha';
import { EventBus, IEventBusConfiguration, subscribe } from '@allgemein/eventbus';
import { HttpFactory, IHttp } from '@allgemein/http';
import { Bootstrap, Config, IMessageOptions, Injector } from '@typexs/base';
import { K_ROUTE_CONTROLLER } from '../../../server/src/libs/Constants';
import { expect } from 'chai';
import { SpawnHandle, TestHelper } from '@typexs/testing';
import { redis_host, redis_port, TEST_STORAGE_OPTIONS } from '../../../server/test/functional/config';
import { WebServer } from '../../../server/src/libs/web/WebServer';
import { clone, cloneDeep } from '@typexs/generic';
import {
  API_CTRL_TASK_EXEC,
  API_CTRL_TASK_GET_METADATA,
  API_CTRL_TASK_LOG,
  API_CTRL_TASK_STATUS,
  API_CTRL_TASKS_METADATA,
  API_CTRL_TASKS_RUNNERS_INFO,
  API_CTRL_TASKS_RUNNING,
  API_CTRL_TASKS_RUNNING_ON_NODE
} from '../../src/lib/Constants';
import { ITaskExectorOptions } from '../../src/lib/ITaskExectorOptions';
import { TaskEvent } from '../../src/lib/event/TaskEvent';
import { TaskExecutor } from '../../src/lib/TaskExecutor';
import { TaskRunnerEvent } from '../../src/lib/TaskRunnerEvent';
import { ITaskRunnerResult } from '../../src/lib/ITaskRunnerResult';


const LOG_EVENT = TestHelper.logEnable(false);


const settingsTemplate: any = {
  storage: {
    default: TEST_STORAGE_OPTIONS
  },

  app: {
    name: 'demo',
    path: __dirname + '/fake_app_tasks',
    nodeId: 'server'
  },

  modules: {
    paths: [
      TestHelper.root()
    ],
    disableCache: true,
    include: [
      '**/@allgemein{,/eventbus}*',
      '**/@typexs{,/base}*',
      '**/@typexs{,/tasks}*',
      '**/@typexs{,/server}*',
      '**/fake_app_tasks*',
      '**/scenario*',
      '**/scenario/node_tasks*'
    ]

  },

  logging: {
    enable: LOG_EVENT,
    level: 'debug',
    transports: [{ console: {} }],
    loggers: [{ name: '*', level: 'debug' }]
  },

  tasks: {
    logger: 'winston',
    logging: 'file'
  },

  server: {
    default: {
      type: 'web',
      framework: 'express',
      host: 'localhost',
      port: 4500,

      routes: [{
        type: K_ROUTE_CONTROLLER,
        context: 'api',
        routePrefix: 'api'
      }]
    }
  },
  eventbus: {
    default: <IEventBusConfiguration>{
      adapter: 'redis',
      extra: { host: redis_host, port: redis_port, unref: true }
    }
  }
};

let bootstrap: Bootstrap = null;
let server: WebServer = null;
let request: IHttp = null;
let p: SpawnHandle = null;
let URL: string = null;


/**
 * Task tests on nodes with differnet tasks
 *
 * - fake_app_tasks
 * - fake_app_node_tasks
 *
 */
@suite('functional/controllers/tasks_controller (on remote node)')
class TasksControllerRemoteSpec {


  static async before() {
    Bootstrap.reset();
    Config.clear();
    const settings = cloneDeep(settingsTemplate);
    request = HttpFactory.create();
    bootstrap = Bootstrap
      .setConfigSources([{ type: 'system' }])
      .configure(settings)
      .activateErrorHandling()
      .activateLogger();

    await bootstrap.prepareRuntime();
    await bootstrap.activateStorage();
    await bootstrap.startup();

    server = Injector.get('server.default');
    await server.start();

    URL = server.url();

    p = SpawnHandle
      .do(__dirname + '/scenario/node_tasks/node_tasks.ts')
      .start(LOG_EVENT);
    await p.started;
    await TestHelper.wait(50);
  }


  static async after() {
    if (p) {
      p.shutdown();
      await p.done;
    }
    if (server) {
      await server.stop();
    }
    if (bootstrap) {
      await bootstrap.shutdown();
    }
    Bootstrap.reset();
    Injector.reset();
    Config.clear();
  }


  @test
  async 'get tasks list and metadata'() {
    const _urlTaskLocal = (URL + '/api' + API_CTRL_TASK_GET_METADATA.replace(':taskName', 'local_simple_task'));
    const _urlTaskRemote = (URL + '/api' + API_CTRL_TASK_GET_METADATA.replace(':taskName', 'simple_task'));
    const _urlTasks = (URL + '/api' + API_CTRL_TASKS_METADATA);

    let rTasks: any = await request.get(_urlTasks, { responseType: 'json' });
    expect(rTasks).to.not.be.null;
    rTasks = rTasks.body;
    let rTaskLocal: any = await request.get(_urlTaskLocal, { responseType: 'json' });
    expect(rTaskLocal).to.not.be.null;
    rTaskLocal = rTaskLocal.body;
    let rTaskRemote: any = await request.get(_urlTaskRemote, { responseType: 'json' });
    expect(rTaskRemote).to.not.be.null;
    rTaskRemote = rTaskRemote.body;

    const rTasksNames = Object.keys(rTasks.definitions);
    expect(rTasksNames).to.have.length(7);
    expect(rTaskLocal).to.deep.include(
      {
        '$schema': 'http://json-schema.org/draft-07/schema#',
        'definitions': {
          'local_simple_task': {
            '$id': '#local_simple_task',
            'title': 'LocalSimpleTask',
            'type': 'object',
            'taskName': 'local_simple_task',
            'worker': false,
            'taskType': 1,
            'groups': [],
            'nodeInfos': [
              {
                'nodeId': 'server',
                'hasWorker': false
              }
            ],
            'permissions': [],
            'remote': false,
            'properties': {
              'value': {
                'optional': true,
                'propertyType': 'incoming',
                'type': 'string'
              }
            }
          }
        },
        '$ref': '#/definitions/local_simple_task'
      }
    );
    expect(rTaskRemote).to.deep.include(
      {
        '$schema': 'http://json-schema.org/draft-07/schema#',
        'definitions': {
          'simple_task': {
            '$id': '#simple_task',
            'groups': [],
            'nodeInfos': [
              {
                'hasWorker': true,
                'nodeId': 'node_tasks'
              }
            ],
            'permissions': [],
            'properties': {},
            'remote': true,
            'taskName': 'simple_task',
            'taskType': 4,
            'title': 'SimpleTask',
            'type': 'object',
            'worker': true
          }
        },
        '$ref': '#/definitions/simple_task'
      }
    );
  }


  @test
  async 'execute remote task (without waiting for results)'() {
    const _url = URL + '/api' + API_CTRL_TASK_EXEC.replace(':taskName', 'simple_task');
    const taskEvent: any = await request.get(_url, { responseType: 'json', passBody: true });
    expect(taskEvent).to.not.be.null;
    expect(taskEvent).to.be.length(1);
    expect(taskEvent[0]).to.be.deep.include({
      errors: [],
      state: 'enqueue',
      topic: 'data',
      taskSpec: ['simple_task'],
      nodeId: 'node_tasks',
      targetIds: ['server'],
      respId: 'node_tasks'
    });

  }

  @test
  async 'execute remote task (waiting for results)'() {

    const options: ITaskExectorOptions = { waitForRemoteResults: true };
    let _url = URL + '/api' + API_CTRL_TASK_EXEC.replace(':taskName', 'simple_task');
    _url = _url + '?options=' + JSON.stringify(options);
    const taskEvent: any = await request.get(_url, { responseType: 'json', passBody: true });
    expect(taskEvent).to.not.be.null;
    expect(taskEvent).to.be.length(1);
    // console.log(inspect(taskEvent, false, 10));
    expect(taskEvent[0]).to.be.deep.include({
      state: 'stopped',
      callerId: 'server',
      nodeId: 'node_tasks',
      targetIds: ['node_tasks'],
      tasks: ['simple_task']
    });
    expect(taskEvent[0].results[0]).to.be.deep.include({
      weight: 0,
      progress: 100,
      total: 100,
      done: true,
      running: false,
      incoming: {},
      outgoing: {},
      result: { task: 'great run' },
      error: null,
      has_error: false,
      counters: { counter: [] },
      name: 'simple_task'
    });
  }


  @test
  async 'execute remote task and get status'() {
    const _url = URL + '/api' + API_CTRL_TASK_EXEC.replace(':taskName', 'simple_task');
    // _url = _url + '?options=' + JSON.stringify(options);
    const taskEvents: any = await request.get(_url, { responseType: 'json', passBody: true });
    expect(taskEvents).to.not.be.null;
    expect(taskEvents).to.be.length(1);
    await TestHelper.wait(100);
    const taskEvent = taskEvents.shift();
    const _urlStatus = URL + '/api' + API_CTRL_TASK_STATUS
      .replace(':runnerId', taskEvent.id);


    const taskStatuses: any = await request.get(_urlStatus, { responseType: 'json', passBody: true });
    // console.log(inspect(taskEvent, false, 10));
    // console.log(inspect(taskStatuses, false, 10));
    expect(taskStatuses).to.not.be.null;
    expect(taskStatuses).to.be.have.length(1);
    const taskStatus = taskStatuses.shift();
    expect(taskStatus).to.be.deep.include({
      tasksId: taskEvent.id,
      taskName: 'simple_task',
      callerId: 'server',
      nodeId: 'node_tasks',
      respId: 'node_tasks',
      hasError: false,
      total: 100
    });
  }

  @test
  async 'execute remote task with parameters'() {
    const events: TaskEvent[] = [];
    const eventRunnert: TaskRunnerEvent[] = [];

    class T02 {
      @subscribe(TaskEvent) on(e: TaskEvent) {
        const _e = cloneDeep(e);
        // console.log('event: ' + e);
        events.push(_e);
      }

      @subscribe(TaskRunnerEvent) onRunerEvent(e: TaskRunnerEvent) {
        const _e2 = cloneDeep(e);
        // console.log('event-runner: ' + e);
        eventRunnert.push(_e2);
      }
    }

    const z = new T02();
    await EventBus.register(z);

    const _url = URL + '/api' + API_CTRL_TASK_EXEC
        .replace(':taskName', 'simple_task_with_params') + '?params=' +
      JSON.stringify({ need_this: { really: { important: 'data' } } }) + '&targetIds=' +
      ['node_tasks'].join('&targetIds=');
    const taskEvents: TaskEvent[] = await request.get(_url, { passBody: true, responseType: 'json' }) as any;
    expect(taskEvents).to.not.be.null;
    expect(taskEvents.length).to.be.gt(0);
    const taskEvent = taskEvents.shift();
    await TestHelper.waitFor(() => !!events.find(x => x.id === taskEvent.id && x.state === 'stopped'));

    await EventBus.unregister(z);

    await TestHelper.wait(100);
    // wait till task is finished
    // TODO check status with targetId as options
    const _urlStatus = URL + '/api' + API_CTRL_TASK_STATUS
      .replace(':runnerId', taskEvent.id);


    const taskStatuses: any = await request.get(_urlStatus, { passBody: true, responseType: 'json' });
    expect(taskStatuses).to.not.be.null;
    expect(taskStatuses.length).to.be.gt(0);
    const taskStatus1 = taskStatuses.shift();

    expect(taskEvent).to.be.deep.include({
      errors: [],
      state: 'enqueue',
      topic: 'data',
      nodeId: 'node_tasks',
      taskSpec: ['simple_task_with_params'],
      targetIds: ['server'],
      parameters: { need_this: { really: { important: 'data' } } },
      respId: 'node_tasks'
    });
    expect(taskStatus1).to.be.deep.include({
      taskName: 'simple_task_with_params',
      taskNr: 0,
      state: 'stopped',
      callerId: 'server',
      nodeId: 'node_tasks',
      respId: 'node_tasks',
      hasError: false,
      progress: 100,
      total: 100,
      done: true,
      running: false,
      weight: 0,
      data:
        {
          results: { task: 'great run with parameters' },
          incoming: { needThis: { really: { important: 'data' } } },
          outgoing: { for_others: 'best regards Robert' },
          error: null
        }
    });
  }


  @test
  async 'execute remote task without necessary parameters'() {
    const _url = URL + '/api' + API_CTRL_TASK_EXEC
        .replace(':taskName', 'simple_task_with_params') + '?targetIds=' +
      ['node_tasks'].join('&targetIds=');
    try {
      const taskEvents: TaskEvent[] = await request.get(_url, { passBody: true, responseType: 'json' }) as any;
      expect(true).to.be.eq(false);
    } catch (err) {
      const body = err.response.body;
      expect(body.message).to.be.eq('The required value is not passed. data: {"required":"needThis"}');
    }
  }


  @test
  async 'execute remote task without necessary parameters (skip throwing)'() {
    const _url = URL + '/api' + API_CTRL_TASK_EXEC
        .replace(':taskName', 'simple_task_with_params') + '?targetIds=' +
      ['node_tasks'].join('&targetIds=') +
      '&options=' + JSON.stringify(<ITaskExectorOptions>{ skipThrow: true });
    const taskEvents: TaskEvent[] = await request.get(_url, { passBody: true, responseType: 'json' }) as any;
    expect(taskEvents).to.have.length(1);
    expect(taskEvents[0].errors).to.have.length(1);
    expect(taskEvents[0].errors[0].message).to.be.eq('The required value is not passed.');
    expect(taskEvents[0].errors[0].data).to.be.deep.eq({ 'required': 'needThis' });
  }

  @test.skip
  async 'execute remote task (request error)'() {

  }

  @test
  async 'execute remote task and wait for results (task error)'() {
    const _url = URL + '/api' + API_CTRL_TASK_EXEC
        .replace(':taskName', 'simple_task_with_error')
      + '?options=' + JSON.stringify(<ITaskExectorOptions>{ waitForRemoteResults: true });

    try {
      const runnerResults: ITaskRunnerResult[] = await request.get(_url,
        { passBody: true, responseType: 'json' }) as any;
      expect(true).to.be.eq(false);
    } catch (err) {
      const body = err.response.body;
      expect(body.message).to.be.eq('never ready');
    }
  }


  @test
  async 'execute remote task and wait for results (task error, skip throw)'() {
    const _url = URL + '/api' + API_CTRL_TASK_EXEC
        .replace(':taskName', 'simple_task_with_error')
      + '?options=' + JSON.stringify(<ITaskExectorOptions>{ skipThrow: true, waitForRemoteResults: true });

    const runnerResults: ITaskRunnerResult[] = await request.get(_url, { passBody: true, responseType: 'json' }) as any;
    expect(runnerResults).to.have.length(1);
    expect(runnerResults[0].results).to.have.length(1);
    expect(runnerResults[0].results[0].error).to.not.be.empty;
    expect(runnerResults[0].results[0].error).to.be.deep.include({
      'className': 'Error',
      'message': 'never ready'
    });
  }


  @test
  async 'get remote log content (default tail 50)'() {
    const exec = Injector.create(TaskExecutor);
    const events = await exec
      .create(
        ['simple_task'],
        {},
        {
          remote: true,
          waitForRemoteResults: true,
          skipTargetCheck: true
        })
      .run() as ITaskRunnerResult[];

    const event = events.shift();
    // console.log(inspect(event, null, 10));

    const _urlLog = URL + '/api' + API_CTRL_TASK_LOG
        .replace(':nodeId', event.nodeId)
        .replace(':runnerId', event.id) +
      '?options=' + JSON.stringify(<IMessageOptions>{ filterErrors: true });

    const taskEvent = (await request.get(_urlLog, { responseType: 'json', passBody: true })) as unknown as any[];
    expect(taskEvent).to.have.length(1);
    const te = taskEvent.shift();
    expect(te).to.contain('task is running');
    expect(te).to.contain('execute tasks: simple_task');
  }


  @test
  async 'error on try get remote log content; cause wrong task id'() {
    const _urlLog = URL + '/api' + API_CTRL_TASK_LOG
      .replace(':nodeId', 'node_tasks')
      .replace(':runnerId', 'none_existing_runnerid');

    const taskEvent = (await request.get(_urlLog, {
      responseType: 'json',
      passBody: true,
      retry: 0
    })) as unknown as any[];
    expect(taskEvent).to.be.deep.eq([
      {
        'error': 'Error',
        'instNr': 0,
        'message': 'file not found',
        'nodeId': 'node_tasks'
      }
    ]);
  }


  @test
  async 'error on try get remote log content; cause filesystem access'() {
    const exec = Injector.create(TaskExecutor);
    const events = await exec
      .create(
        ['simple_task'],
        {},
        {
          remote: true,
          waitForRemoteResults: true,
          skipTargetCheck: true
        })
      .run() as ITaskRunnerResult[];

    const event = events.shift();
    // console.log(inspect(event, null, 10));

    const _urlLog = URL + '/api' + API_CTRL_TASK_LOG
      .replace(':nodeId', event.nodeId)
      .replace(':runnerId', event.id);

    const taskEvent = (await request.get(_urlLog, { responseType: 'json', passBody: true })) as unknown as any[];
    expect(taskEvent).to.have.length(1);
    // expect(JSON.parse(taskEvent[0])).to.be.have.keys(['error', 'message', 'nodeId', 'instNr']);
    expect(typeof taskEvent[0]).to.be.eq('string');
  }


  @test
  async 'get all active runners'() {
    const _urlLog = URL + '/api' + API_CTRL_TASKS_RUNNERS_INFO;
    const runnersStatus = (await request.get(_urlLog, { responseType: 'json', passBody: true })) as unknown as any[];

    const exec = Injector.create(TaskExecutor);
    const executionEvent = await exec
      .create(
        ['simple_task_with_timeout'],
        { timeout: 1000 },
        {
          remote: true,
          skipTargetCheck: true,
          waitForRemoteResults: false
        })
      .run() as TaskEvent[];


    await TestHelper.wait(200);
    const runnersStatus2 = (await request.get(_urlLog, { responseType: 'json', passBody: true })) as unknown as any[];
    await TestHelper.wait(1000);
    expect(runnersStatus).to.have.length(0);

    expect(executionEvent).to.have.length(1);
    expect(executionEvent[0]).to.deep.include({
      state: 'enqueue',
      taskSpec: ['simple_task_with_timeout'],
      parameters: { timeout: 1000 },
      nodeId: 'node_tasks',
      targetIds: ['server'],
      respId: 'node_tasks'
    });
    expect(runnersStatus2).to.have.length(1);
    expect(runnersStatus2[0]).to.deep.include({
      state: 'running',
      callerId: 'server',
      nodeId: 'node_tasks',
      targetIds: ['node_tasks'],
      tasks: ['simple_task_with_timeout']
    });
  }


  @test.skip
  async 'get task status information'() {
  }


  @test.skip
  async 'get remote log file for a task'() {
  }


  @test.skip
  async 'get remote log file content for a task'() {
  }


  @test
  async 'get all runnings tasks'() {
    const _urlLog = URL + '/api' + API_CTRL_TASKS_RUNNING;
    const runningTasks = (await request.get(_urlLog, { responseType: 'json', passBody: true })) as unknown as any[];

    const exec = Injector.create(TaskExecutor);
    const executionEvent = await exec
      .create(
        ['simple_task_with_timeout'],
        { timeout: 1000 },
        {
          remote: true,
          skipTargetCheck: true,
          waitForRemoteResults: false
        })
      .run() as TaskEvent[];


    await TestHelper.wait(200);
    const runningTasks2 = (await request.get(_urlLog, { responseType: 'json', passBody: true })) as unknown as any[];
    await TestHelper.wait(1000);
    // console.log(inspect(runningTasks, false, 10));
    // console.log(inspect(executionEvent, false, 10));
    // console.log(inspect(runningTasks2, false, 10));

    expect(runningTasks).to.have.length(0);

    expect(executionEvent).to.have.length(1);
    expect(executionEvent[0]).to.deep.include({
      state: 'enqueue',
      taskSpec: ['simple_task_with_timeout'],
      parameters: { timeout: 1000 },
      nodeId: 'node_tasks',
      targetIds: ['server'],
      respId: 'node_tasks'
    });
    expect(runningTasks2).to.have.length(2);
    expect(runningTasks2[0]).to.deep.include({
      skipping: false,
      state: 'running',
      taskNames: ['simple_task_with_timeout'],
      running: ['simple_task_with_timeout'],
      finished: [],
      nodeId: 'node_tasks'
    });
  }

  @test
  async 'get runnings tasks from own node'() {
    const _urlLog = URL + '/api' + API_CTRL_TASKS_RUNNING_ON_NODE.replace(':nodeId', 'server');
    const runningTasks = (await request.get(_urlLog, { responseType: 'json', passBody: true })) as unknown as any[];

    const exec = Injector.create(TaskExecutor);
    const executionEvent = await exec
      .create(
        ['simple_task_with_timeout'],
        { timeout: 1000 },
        {
          remote: true,
          skipTargetCheck: true,
          waitForRemoteResults: false
        })
      .run() as TaskEvent[];


    await TestHelper.wait(200);
    const runningTasks2 = (await request.get(_urlLog, { responseType: 'json', passBody: true })) as unknown as any[];
    await TestHelper.wait(1000);
    expect(runningTasks).to.have.length(0);

    expect(executionEvent).to.have.length(1);
    expect(executionEvent[0]).to.deep.include({
      state: 'enqueue',
      taskSpec: ['simple_task_with_timeout'],
      parameters: { timeout: 1000 },
      nodeId: 'node_tasks',
      targetIds: ['server'],
      respId: 'node_tasks'
    });
    expect(runningTasks2).to.have.length(1);
    expect(runningTasks2[0]).to.deep.include({
      skipping: false,
      state: 'running',
      taskNames: ['simple_task_with_timeout'],
      running: ['simple_task_with_timeout'],
      finished: [],
      nodeId: 'node_tasks'
    });
  }

}

