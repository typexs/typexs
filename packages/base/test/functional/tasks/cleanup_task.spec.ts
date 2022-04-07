import * as _ from 'lodash';
import { suite, test } from '@testdeck/mocha';
import { expect } from 'chai';
import { TestHelper } from '@typexs/testing';
import { TaskExecutor } from '../../../src/libs/tasks/TaskExecutor';
import { TEST_STORAGE_OPTIONS } from '../config';
import { ITaskRunnerResult } from '../../../src/libs/tasks/ITaskRunnerResult';
import { Bootstrap } from '../../../src/Bootstrap';
import { ITypexsOptions } from '../../../src/libs/ITypexsOptions';
import { Injector } from '../../../src/libs/di/Injector';
import { StorageRef } from '../../../src/libs/storage/StorageRef';
import { TaskLog } from '../../../src/entities/TaskLog';
import { C_STORAGE_DEFAULT } from '../../../src/libs/Constants';
import { DateUtils } from '../../../src/libs/utils/DateUtils';
import { TN_TASKS_CLEANUP, TASK_STATE_STOPPED } from '../../../src/libs/tasks/Constants';
import { TaskState } from '../../../src/libs/tasks/TaskState';

// process.env.SQL_LOG = '1';


const LOG_EVENT = TestHelper.logEnable(false);

let bootstrap: Bootstrap;
let dateNow: Date;


@suite('functional/tasks/cleanup_task')
class CleanupTaskSpec {

  static async before() {
    Bootstrap.reset();
    await TestHelper.clearCache();

    const nodeId = 'system_0';
    bootstrap = Bootstrap
      .setConfigSources([{ type: 'system' }])
      .configure(<ITypexsOptions & any>{
        app: {
          name: 'test',
          nodeId: nodeId,
          path: TestHelper.root()
        },
        logging: { enable: LOG_EVENT, level: 'debug', loggers: [{ name: '*', level: 'debug' }] },
        modules: {
          disableCache: true,
          paths: TestHelper.includePaths(),
          include: [
            '**/@typexs{,/base}',
            '**/packages{,/base}'
          ]
        },
        storage: { default: TEST_STORAGE_OPTIONS }
      });
    bootstrap.activateLogger();
    bootstrap.activateErrorHandling();
    await bootstrap.prepareRuntime();
    bootstrap = await bootstrap.activateStorage();
    bootstrap = await bootstrap.startup();

  }

  async before() {
    const storageRef = Injector.get(C_STORAGE_DEFAULT) as StorageRef;

    const logs = [];

    const length = 14;
    const dateStr = new Date().toISOString().split('T').shift();
    dateNow = DateUtils.fromISO(dateStr + 'T12:00:00+02:00');
    for (let i = 0; i <= length; i++) {
      const x = new TaskLog();
      x.callerId = 'x' + i;
      x.data = {} as any;
      x.created = DateUtils.sub({ days: i }, dateNow);
      x.started = DateUtils.sub({ days: i }, dateNow);
      x.stopped = DateUtils.sub({ days: i }, dateNow);
      x.taskNr = i;
      x.tasksId = 'id' + i;
      x.taskName = 'id' + i;
      x.state = TASK_STATE_STOPPED;
      x.respId = 'node';
      x.nodeId = 'node';
      logs.push(x);
    }
    await storageRef.getController().save(logs);
  }

  static async after() {
    if (bootstrap) {
      await bootstrap.shutdown();
    }
  }


  /**
   * Check local execution of a task
   */
  @test
  async 'execute cleanup task'() {
    const executor = Injector.create(TaskExecutor);
    const data = await executor.create(
      [TN_TASKS_CLEANUP],
      {},
      {
        isLocal: true,
        skipTargetCheck: true
      }).run() as ITaskRunnerResult;

    const oddDate = (new Date()) <= dateNow ? 7 : 8 ;
    expect(data.results).to.not.be.empty;
    const x = data.results.find(
      (x: any) => x.name === _.snakeCase('TasksCleanup'));
    expect(x.name).to.be.eq(_.snakeCase('TasksCleanup'));
    expect((x as TaskState).counters.asObject()).to.be.deep.eq({
      // 'remove': oddDate === 0 ? 7 : 8
      'remove': oddDate
    });

  }


}
