import { cloneDeep } from '@typexs/generic';


import { suite, test } from '@testdeck/mocha';
import { expect } from 'chai';
import { Bootstrap } from '@typexs/base';
import { redis_host, redis_port, TEST_STORAGE_OPTIONS } from '../../../base/test/functional/config';
import { EventBus, IEventBusConfiguration, RedisEventBusAdapter } from '@allgemein/eventbus';
import { System } from '@typexs/base';
import { C_TASKS } from '../../src/lib/Constants';
import { SpawnHandle, TestHelper } from '@typexs/testing';
import { ITypexsOptions } from '@typexs/base';
import { Tasks } from '../../src/lib/Tasks';
import { Injector } from '@typexs/base';

const LOG_EVENT = TestHelper.logEnable(false);


@suite('functional/tasks/system')
class TasksSystemSpec {


  async before() {
    EventBus.registerAdapter(RedisEventBusAdapter);
    await TestHelper.clearCache();
    Bootstrap.reset();
  }


  @test
  async 'pass task information to system object'() {
    const nodeId = 'system_0';
    let bootstrap = Bootstrap
      .setConfigSources([{ type: 'system' }])
      .configure(<ITypexsOptions & any>{
        app: {
          name: 'test',
          nodeId: nodeId,
          path: __dirname + '/fake_app'
        },
        logging: {
          enable: LOG_EVENT, level: 'debug'
        },
        modules: TestHelper.modulSettings(['base', 'tasks']),
        storage: {
          default: TEST_STORAGE_OPTIONS
        },
        eventbus: {
          default: <IEventBusConfiguration>{
            adapter: 'redis',
            extra: {
              host: redis_host,
              port: redis_port,
              unref: true
            }
          }
        }
      });
    bootstrap.activateLogger();
    bootstrap.activateErrorHandling();
    await bootstrap.prepareRuntime();
    bootstrap = await bootstrap.activateStorage();
    bootstrap = await bootstrap.startup();

    const system: System = Injector.get(System.NAME);
    const n = cloneDeep(system.node);

    await bootstrap.shutdown();

    expect(n.nodeId).to.eq(nodeId);
    expect(n.contexts).to.have.length.gt(0);
    const taskContext = n.contexts.find(x => x.context === C_TASKS);
    expect(taskContext.context).to.eq(C_TASKS);

    expect(taskContext.tasks).to.deep.include({
      '$schema': 'http://json-schema.org/draft-07/schema#',
      'anyOf': [
        {
          '$ref': '#/definitions/test'
        },
        {
          '$ref': '#/definitions/tasks_cleanup'
        }
      ]
    });
    expect(taskContext.tasks.definitions.test).to.deep.eq({
      '$id': '#test',
      'description': 'Hallo welt',
      'groups': [],
      'nodeInfos': [
        {
          'hasWorker': false,
          'nodeId': 'system_0'
        }
      ],
      'permissions': [],
      'properties': {
        'someValue': {
          'propertyType': 'incoming',
          'type': 'string'
        }
      },
      'remote': false,
      'taskName': 'test',
      'taskType': 1,
      'title': 'TestTask',
      'type': 'object',
      'worker': false
    });
  }


  @test
  async 'update task information by additional remote execution'() {
    const nodeId = 'system_1';
    let bootstrap = Bootstrap
      .setConfigSources([{ type: 'system' }])
      .configure(<ITypexsOptions & any>{
        app: { name: 'test', nodeId: nodeId, path: __dirname + '/fake_app' },
        logging: { enable: LOG_EVENT, level: 'debug' },
        modules: TestHelper.modulSettings(['base', 'tasks']),
        storage: { default: TEST_STORAGE_OPTIONS },
        eventbus: { default: <IEventBusConfiguration>{ adapter: 'redis', extra: { host: redis_host, port: redis_port, unref: true } } }
      });
    bootstrap.activateLogger();
    bootstrap.activateErrorHandling();
    await bootstrap.prepareRuntime();
    bootstrap = await bootstrap.activateStorage();
    bootstrap = await bootstrap.startup();

    const system: System = Injector.get(System.NAME);
    const tasks: Tasks = Injector.get(Tasks.NAME);

    let taskInfos = tasks.getTasks(true);

    expect(system.nodes).to.have.length(0);
    expect(taskInfos).to.have.length.gte(1);
    expect(taskInfos.find(x => x.name === 'test').getOptions()).to.deep.eq({
      description: 'Hallo welt',
      namespace: 'tasks',
      permissions: [],
      groups: [],
      nodeInfos: [
        {
          'hasWorker': false,
          'nodeId': nodeId
        }
      ],
      remote: false,
      taskName: 'test',
      taskType: 1,
      title: 'TestTask',
      worker: false
    });

    const p = SpawnHandle.do(__dirname + '/fake_app/node.ts').start(LOG_EVENT);
    await p.started;
    await TestHelper.wait(100);

    taskInfos = tasks.getTasks(true);
    expect(system.nodes).to.have.length(1);
    expect(taskInfos).to.have.length.gte(1);
    expect(taskInfos.find(x => x.name === 'test').getOptions()).to.deep.eq({
      'description': 'Hallo welt',
      'groups': [],
      'namespace': 'tasks',
      'nodeInfos': [
        {
          'hasWorker': false,
          'nodeId': 'system_1'
        },
        {
          'hasWorker': false,
          'nodeId': 'fakeapp01'
        }
      ],
      'permissions': [],
      'remote': false,
      'taskName': 'test',
      'taskType': 1,
      'title': 'TestTask',
      'worker': false
    });

    p.shutdown();
    await p.done;
    await TestHelper.wait(100);
    taskInfos = tasks.getTasks(true);
    expect(taskInfos).to.have.length.gte(1);
    expect(taskInfos.find(x => x.name === 'test').getOptions()).to.deep.eq({
      'description': 'Hallo welt',
      'groups': [],
      'namespace': 'tasks',
      'nodeInfos': [
        {
          'hasWorker': false,
          'nodeId': 'system_1'
        }
      ],
      'permissions': [],
      'remote': false,
      'taskName': 'test',
      'taskType': 1,
      'title': 'TestTask',
      'worker': false
    });

    await bootstrap.shutdown();
    expect(system.nodes).to.have.length(0);

  }


  @test
  async 'get task information from remote node'() {
    const APP_NAME = 'fake_app_main';
    const REMOTE_APP_NAME = 'fake_app';
    const nodeId = 'system_2';
    let bootstrap = Bootstrap
      .setConfigSources([{ type: 'system' }])
      .configure(<ITypexsOptions & any>{
        app: {
          name: 'test',
          nodeId: nodeId,
          path: __dirname + '/' + APP_NAME
        },
        logging: {
          enable: LOG_EVENT, level: 'debug'
        },
        modules: TestHelper.modulSettings(['base', 'tasks']),
        storage: {
          default: TEST_STORAGE_OPTIONS
        },
        eventbus: {
          default: <IEventBusConfiguration>{
            adapter: 'redis',
            extra: {
              host: redis_host,
              port: redis_port,
              unref: true
            }
          }
        }
      });
    bootstrap.activateLogger();
    bootstrap.activateErrorHandling();
    await bootstrap.prepareRuntime();
    bootstrap = await bootstrap.activateStorage();
    bootstrap = await bootstrap.startup();

    const system: System = Injector.get(System.NAME);
    const tasks: Tasks = Injector.get(Tasks.NAME);
    let taskInfos = tasks.getTasks(true);

    expect(system.nodes).to.have.length.gte(0);
    expect(taskInfos).to.have.length.gte(0);


    const p = SpawnHandle.do(__dirname + '/' + REMOTE_APP_NAME + '/node.ts').start(LOG_EVENT);
    await p.started;
    await TestHelper.wait(50);


    expect(system.nodes).to.have.length(1);

    taskInfos = tasks.getTasks(true);
    expect(taskInfos).to.have.length(2);
    expect(taskInfos.find(x => x.name === 'test').getOptions()).to.deep.eq({
      'description': 'Hallo welt',
      'groups': [],
      'metaType': 'class_ref',
      'name': 'test',
      'namespace': 'tasks',
      'nodeInfos': [
        {
          'hasWorker': false,
          'nodeId': 'fakeapp01'
        }
      ],
      'permissions': [],
      'remote': true,
      'taskName': 'test',
      'taskType': 4,
      'title': 'TestTask',
      'worker': false
    });


    p.shutdown();
    await p.done;
    await bootstrap.shutdown();

    taskInfos = tasks.getTasks(true);
    expect(system.nodes).to.have.length(0);
    expect(taskInfos).to.have.length(0);

  }


  /**
   * Infos:
   *
   * - local + remote on same node
   * - local + remote on different nodes
   *
   * - remote properties?
   */


}

