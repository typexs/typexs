import { suite, test } from '@testdeck/mocha';
import { expect } from 'chai';
import { Bootstrap } from '@typexs/base';
import { Config } from '@allgemein/config';
import { Scheduler } from '@typexs/base';
import { IScheduleFactory } from '@typexs/base';
import { SimpleTask } from './tasks/SimpleTask';
import { RuntimeLoader } from '@typexs/base';
import { Log } from '@typexs/base';
import { K_CLS_SCHEDULE_ADAPTER_FACTORIES } from '@typexs/base';
import { Invoker } from '@typexs/base';
import { TasksApi } from '../../src/api/Tasks.api';
import { Tasks } from '../../src/lib/Tasks';
import { TaskRunnerRegistry } from '../../src/lib/TaskRunnerRegistry';
import { RegistryFactory } from '@allgemein/schema-api';
import { Injector } from '@typexs/base';
import { C_TASKS } from '../../src/lib/Constants';
import { TaskWithParameters } from 'demo-task/tasks/TaskWithParameters';
import { TaskWithRequiredParameters } from 'demo-task/tasks/TaskWithRequiredParameters';


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
      appdir: __dirname + '/../../../src',
      libs: [{
        topic: K_CLS_SCHEDULE_ADAPTER_FACTORIES,
        refs: [
          'adapters/scheduler/*Factory.*',
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


  @test
  async 'execute multiple tasks with incomings'() {
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
              valueString: 'test1'
            }
          },
          {
            name: 'task_with_required_parameters',
            incomings: {
              valueString: 'test2'
            }
          }
        ]
      }
    });

    await schedule.runSchedule();
    expect(schedule.lastResults).to.not.be.null;
    expect(schedule.lastResults.tasks).to.be.deep.eq(['task_with_required_parameters', 'task_with_required_parameters']);
    expect(schedule.lastResults.results[0].incoming).to.be.deep.eq({ valueString: 'test1' });
    expect(schedule.lastResults.results[0].result).to.be.eq('test1');
    expect(schedule.lastResults.results[1].incoming).to.be.deep.eq({ valueString: 'test2' });
    expect(schedule.lastResults.results[1].result).to.be.eq('test2');
  }

}


