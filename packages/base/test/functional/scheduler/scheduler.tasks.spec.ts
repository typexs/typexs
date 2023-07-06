import { suite, test } from '@testdeck/mocha';
import { expect } from 'chai';
import { Bootstrap } from '../../../src/Bootstrap';
import { Config } from '@allgemein/config';
import { Scheduler } from '../../../src/libs/schedule/Scheduler';
import { EventBus, subscribe } from '@allgemein/eventbus';
import { TestHelper } from '@typexs/testing';
import { IScheduleFactory } from '../../../src/libs/schedule/IScheduleFactory';
import { SimpleTask } from '../tasks/tasks/SimpleTask';
import { RuntimeLoader } from '../../../src/base/RuntimeLoader';
import { Log } from '../../../src/libs/logging/Log';
import { K_CLS_SCHEDULE_ADAPTER_FACTORIES } from '../../../src/libs/Constants';
import { Invoker } from '../../../src/base/Invoker';
import { TasksApi } from '../../../src/api/Tasks.api';
import { Tasks } from '../../../src/libs/tasks/Tasks';
import { TaskRunnerRegistry } from '../../../src/libs/tasks/TaskRunnerRegistry';
import { RegistryFactory } from '@allgemein/schema-api';
import { Injector } from '../../../src/libs/di/Injector';
import { C_TASKS } from '../../../src/libs/tasks/Constants';
import { DateTime } from 'luxon';
import { TaskWithParameters } from 'testtask/src/tasks/TaskWithParameters';
import { TaskWithRequiredParameters } from 'testtask/src/tasks/TaskWithRequiredParameters';

let loader: RuntimeLoader = null;
let factories: IScheduleFactory[] = [];

@suite('functional/scheduler - tasks')
class SchedulerSpec {

  static after() {
    Injector.reset();
  }


  async before() {
    Bootstrap.reset();
    Log.options({ enable: false, level: 'debug' });
    Config.clear();
    loader = new RuntimeLoader({
      appdir: __dirname + '/../../..',
      libs: [{
        topic: K_CLS_SCHEDULE_ADAPTER_FACTORIES,
        refs: [
          'src/adapters/scheduler/*Factory.*'
        ]
      }]
    });
    await loader.prepare();
    factories = loader.getClasses(K_CLS_SCHEDULE_ADAPTER_FACTORIES).map(x => Injector.get(x));

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


  @test
  async 'execute single task'() {
    const tasks = RegistryFactory.get(C_TASKS) as Tasks;
    tasks.setNodeId('testnode');
    const taskRef = tasks.addTask(SimpleTask);
    Injector.set(Tasks.NAME, tasks);

    const scheduler = new Scheduler();
    await scheduler.prepare(factories);
    const schedule = await scheduler.register({
      name: 'test01',
      task: {
        name: 'simple_task',
        remote: false
      }
    });

    await schedule.runSchedule();
    expect(schedule.lastResults).to.not.be.null;
    expect(schedule.lastResults.tasks).to.be.deep.eq(['simple_task']);
  }

  @test
  async 'execute multiple tasks'() {
    const tasks = RegistryFactory.get(C_TASKS) as Tasks;
    tasks.setNodeId('testnode');
    const taskRef = tasks.addTask(SimpleTask);
    const taskRef2 = tasks.addTask(TaskWithParameters);
    Injector.set(Tasks.NAME, tasks);

    const scheduler = new Scheduler();
    await scheduler.prepare(factories);
    const schedule = await scheduler.register({
      name: 'test01',
      task: {
        name: [
          'simple_task',
          'task_with_parameters'
        ]
      }
    });

    await schedule.runSchedule();
    expect(schedule.lastResults).to.not.be.null;
    expect(schedule.lastResults.tasks).to.be.deep.eq(['simple_task', 'task_with_parameters']);
  }


  @test
  async 'execute task with incomings'() {
    const tasks = RegistryFactory.get(C_TASKS) as Tasks;
    tasks.setNodeId('testnode');
    const taskRef2 = tasks.addTask(TaskWithRequiredParameters);
    Injector.set(Tasks.NAME, tasks);

    const scheduler = new Scheduler();
    await scheduler.prepare(factories);
    const schedule = await scheduler.register({
      name: 'test01',
      task: {
        name: [
          {
            name: 'task_with_required_parameters',
            incomings: {
              valueString: 'test'
            }
          }
        ]
      }
    });

    await schedule.runSchedule();
    expect(schedule.lastResults).to.not.be.null;
    expect(schedule.lastResults.results[0].incoming).to.be.deep.eq({ valueString: 'test' });
    expect(schedule.lastResults.results[0].result).to.be.eq('test');
    expect(schedule.lastResults.tasks).to.be.deep.eq(['task_with_required_parameters']);
  }


}


