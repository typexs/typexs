import { suite, test } from '@testdeck/mocha';
import { expect } from 'chai';
import { SimpleTaskWithArgs } from './tasks/SimpleTaskWithArgs';
import { SimpleTaskUngrouped01 } from './tasks/SimpleTaskUngrouped01';
import { SimpleTaskUngrouped02 } from './tasks/SimpleTaskUngrouped02';
import { SimpleTaskWithRuntimeLog } from './tasks/SimpleTaskWithRuntimeLog';
import { TestHelper } from '@typexs/testing';
import { Log } from '../../../src/libs/logging/Log';
import { Invoker } from '../../../src/base/Invoker';
import { TasksApi } from '../../../src/api/Tasks.api';
import { Tasks } from '../../../src/libs/tasks/Tasks';
import { TaskRunnerRegistry } from '../../../src/libs/tasks/TaskRunnerRegistry';
import { Injector } from '../../../src/libs/di/Injector';
import { RegistryFactory } from '@allgemein/schema-api';
import { C_TASKS, TASK_STATE_STOPPED } from '../../../src/libs/tasks/Constants';
import { TaskRef } from '../../../src/libs/tasks/TaskRef';


const LOG_EVENT = TestHelper.logEnable(false);
let tasks: Tasks;

@suite('functional/tasks/json_schema')
class TasksJsonSchemaSpec {

  static async before() {
    await TestHelper.clearCache();
    Log.reset();
    Log.options({ level: 'debug', enable: LOG_EVENT });
    const i = new Invoker();
    Injector.set(Invoker.NAME, i);
    i.register(TasksApi, []);

    RegistryFactory.remove(C_TASKS);
    RegistryFactory.register(/^tasks\.?/, Tasks);

    const tasks = RegistryFactory.get(C_TASKS) as Tasks;
    Injector.set(Tasks.NAME, tasks);

    const registry = new TaskRunnerRegistry();
    Injector.set(TaskRunnerRegistry.NAME, registry);
  }


  static after() {
    Injector.reset();
  }


  before() {
    tasks = RegistryFactory.get(C_TASKS) as Tasks;
    tasks.setNodeId('testnode');
  }

  after() {
    tasks.reset();
    RegistryFactory.remove(C_TASKS);
  }

  @test
  async 'toJson and fromJson'() {
    tasks.reset();

    tasks.addTask(SimpleTaskUngrouped01);
    tasks.addTask(SimpleTaskUngrouped02);
    tasks.addTask(SimpleTaskWithArgs);
    tasks.addTask(SimpleTaskWithRuntimeLog);

    const out = await tasks.toJsonSchema();
    // console.log(inspect(out, false, 10));
    expect(out).to.be.deep.eq(
      {
        '$schema': 'http://json-schema.org/draft-07/schema#',
        'anyOf': [
          {
            '$ref': '#/definitions/simple_task_ungrouped_01'
          },
          {
            '$ref': '#/definitions/simple_task_ungrouped_02'
          },
          {
            '$ref': '#/definitions/simple_task_with_args'
          },
          {
            '$ref': '#/definitions/simple_task_with_runtime_log'
          }
        ],
        'definitions': {
          'simple_task_ungrouped_01': {
            '$id': '#simple_task_ungrouped_01',
            'groups': [],
            'nodeInfos': [
              {
                'hasWorker': false,
                'nodeId': 'testnode'
              }
            ],
            'permissions': [],
            'properties': {},
            'remote': false,
            'taskName': 'simple_task_ungrouped_01',
            'taskType': 1,
            'title': 'SimpleTaskUngrouped01',
            'type': 'object'
          },
          'simple_task_ungrouped_02': {
            '$id': '#simple_task_ungrouped_02',
            'groups': [],
            'nodeInfos': [
              {
                'hasWorker': false,
                'nodeId': 'testnode'
              }
            ],
            'permissions': [],
            'properties': {},
            'remote': false,
            'taskName': 'simple_task_ungrouped_02',
            'taskType': 1,
            'title': 'SimpleTaskUngrouped02',
            'type': 'object'
          },
          'simple_task_with_args': {
            '$id': '#simple_task_with_args',
            'groups': [],
            'nodeInfos': [
              {
                'hasWorker': false,
                'nodeId': 'testnode'
              }
            ],
            'permissions': [],
            'properties': {
              'incoming': {
                'optional': false,
                'propertyType': 'incoming',
                'type': 'string'
              },
              'list': {
                'items': {
                  'type': 'object'
                },
                'propertyType': 'incoming',
                'type': 'array'
              },
              'outgoing': {
                'propertyType': 'outgoing',
                'type': 'string'
              }
            },
            'remote': false,
            'taskName': 'simple_task_with_args',
            'taskType': 1,
            'title': 'SimpleTaskWithArgs',
            'type': 'object'
          },
          'simple_task_with_runtime_log': {
            '$id': '#simple_task_with_runtime_log',
            'groups': [],
            'nodeInfos': [
              {
                'hasWorker': false,
                'nodeId': 'testnode'
              }
            ],
            'permissions': [],
            'properties': {},
            'remote': false,
            'taskName': 'simple_task_with_runtime_log',
            'taskType': 1,
            'title': 'SimpleTaskWithRuntimeLog',
            'type': 'object'
          }
        }
      }
    );

    tasks.reset();
    const taskList = await tasks.fromJsonSchema(out) as TaskRef[];
    expect(taskList).to.have.length(4);
    const properties = [].concat(...(taskList as TaskRef[]).map(x => x.getPropertyRefs()));
    expect(properties).to.have.length(3);

    const out2 = await tasks.toJsonSchema();
    expect(out).to.be.deep.eq(out2);

    const task01 = taskList.shift();
    expect(task01.name).to.be.eq('simple_task_ungrouped_01');
    const props01 = task01.getPropertyRefs();
    expect(props01).to.have.length(0);

    const task02 = taskList.shift();
    expect(task02.name).to.be.eq('simple_task_ungrouped_02');
    const props02 = task02.getPropertyRefs();
    expect(props02).to.have.length(0);

    const task03 = taskList.shift();
    expect(task03.name).to.be.eq('simple_task_with_args');
    const props03 = task03.getPropertyRefs();
    expect(props03).to.have.length(3);

    const task04 = taskList.shift();
    expect(task04.name).to.be.eq('simple_task_with_runtime_log');
    const props04 = task04.getPropertyRefs();
    expect(props04).to.have.length(0);
  }


}
