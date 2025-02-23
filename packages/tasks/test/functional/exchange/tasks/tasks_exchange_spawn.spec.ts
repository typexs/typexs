import { suite, test } from '@testdeck/mocha';
import * as path from 'path';
import { copyFile } from 'node:fs/promises';
import { Bootstrap } from '@typexs/base';
import { Config } from '@allgemein/config';
import { TestHelper } from '@typexs/testing';
import { SpawnHandle } from '@typexs/testing';
import { Injector } from '@typexs/base';
import { expect } from 'chai';
import { TasksExchange } from '../../../../src/adapters/exchange/tasks/TasksExchange';
import { TaskExecutor } from '../../../../src/lib/TaskExecutor';
import { TaskFuture } from '../../../../src/lib/worker/execute/TaskFuture';
import { FileSystemExchange } from '@typexs/base';
import { LOCAL_LOG_DIR, REMOTE_LOG_DIR } from './config';
import { PlatformUtils } from '@allgemein/base';


const LOG_EVENT = TestHelper.logEnable(false);

let bootstrap: Bootstrap;
let spawned: SpawnHandle;

@suite('functional/messaging/tasks/exchange_spawn')
class MessagingSpec {


  static async before() {
    if (!PlatformUtils.fileExist(LOCAL_LOG_DIR + '/logs')) {
      PlatformUtils.mkdir(LOCAL_LOG_DIR + '/logs');
    }
    if (!PlatformUtils.fileExist(REMOTE_LOG_DIR + '/logs')) {
      PlatformUtils.mkdir(REMOTE_LOG_DIR + '/logs');
    }

    await copyFile(
      __dirname + '/fake_app/files/taskmonitor-abcdef-fake_app.log',
      LOCAL_LOG_DIR + '/logs/taskmonitor-abcdef-fake_app.log');
    await copyFile(
      __dirname + '/fake_app/files/taskmonitor-abcdef-remote_fakeapp01.log',
      REMOTE_LOG_DIR + '/logs/taskmonitor-abcdef-remote_fakeapp01.log');

    Bootstrap.reset();
    Config.clear();
    spawned = SpawnHandle.do(__dirname + '/fake_app/node_01.ts').start(LOG_EVENT);

    const appdir = path.join(__dirname, 'fake_app');

    bootstrap = await Bootstrap.configure(<any>
      {
        app: {
          nodeId: 'fake_app',
          name: 'fake_app',
          path: appdir
        },
        logging: {
          enable: LOG_EVENT,
          level: 'debug',
          transports: [{ console: {} }],
          loggers: [<any>{ name: '*', level: 'debug' }]
        },
        modules: <any>{
          paths: TestHelper.includePaths(['base', 'tasks']),
          disableCache: true
          // include: [
          //   '**/@typexs{,/base,/tasks}'
          // ]
        },
        tasks: {
          logdir: LOCAL_LOG_DIR + '/logs'
        },
        filesystem: {
          paths: [
            LOCAL_LOG_DIR
          ]
        }
      }
    );
    await bootstrap.activateLogger();
    await bootstrap.prepareRuntime();
    await bootstrap.activateStorage();
    await bootstrap.startup();
    await spawned.started;
    await TestHelper.wait(500);
  }


  static async after() {
    if (spawned) {
      spawned.shutdown();
      await spawned.done;
    }
    if (bootstrap) {
      await bootstrap.shutdown();
    }
  }


  @test
  async 'get log file path from remote only'() {
    const exchange = Injector.get(TasksExchange);
    const results = await exchange.getLogFilePath('abcdef', { filterErrors: true, skipLocal: true });
    expect(results).to.have.length(1);
    expect(results[0]).to.be.eq(REMOTE_LOG_DIR + '/logs/taskmonitor-abcdef-remote_fakeapp01.log');
  }


  @test
  async 'get log file path from local and remote only'() {
    const exchange = Injector.get(TasksExchange);
    const results = await exchange.getLogFilePath('abcdef', { filterErrors: true });
    expect(results).to.have.length(2);
    expect(results.sort()).to.be.deep.eq([
      REMOTE_LOG_DIR + '/logs/taskmonitor-abcdef-remote_fakeapp01.log',
      LOCAL_LOG_DIR + '/logs/taskmonitor-abcdef-fake_app.log'
    ].sort());
  }


  @test
  async 'get log file path as map from local and remote only'() {
    const exchange = Injector.get(TasksExchange);
    const results = await exchange.getLogFilePath('abcdef', { filterErrors: true, outputMode: 'map' });
    expect(Object.keys(results)).to.have.length(2);
    const new2 = {};
    Object.keys(results).sort().map(x => {
      new2[x] = results[x];
    });
    expect(new2).to.be.deep.eq({
      'fake_app:0': LOCAL_LOG_DIR + '/logs/taskmonitor-abcdef-fake_app.log',
      'remote_fakeapp01:0': REMOTE_LOG_DIR + '/logs/taskmonitor-abcdef-remote_fakeapp01.log'
    });
  }


  @test
  async 'get log file path with errors'() {
    const exchange = Injector.get(TasksExchange);
    const results = await exchange.getLogFilePath('abcdef2', {});
    expect(results).to.have.length(2);
    expect(results.map(x => x['message'])).to.be.deep.eq([
      'file for runner abcdef2 not found',
      'file for runner abcdef2 not found'
    ]);
  }


  @test
  async 'get log file path with filtered errors'() {
    const exchange = Injector.get(TasksExchange);
    const results = await exchange.getLogFilePath('abcdef2', { filterErrors: true });
    // console.log(inspect(results, false, 10));
    expect(results).to.have.length(0);
    expect(results).to.be.deep.eq([]);
  }

  @test
  async 'get log file content (over log file path)'() {
    const exchange = Injector.get(TasksExchange);
    const results = await exchange.getLogFilePath('abcdef', { filterErrors: true, skipLocal: true, relative: true });
    expect(results).to.have.length(1);
    expect(results[0]).to.be.eq(REMOTE_LOG_DIR + '/logs/taskmonitor-abcdef-remote_fakeapp01.log');

    const fsExchange = Injector.get(FileSystemExchange);
    const content = await fsExchange.file({ path: results[0], skipLocal: true });
    expect(content).to.have.length(1);
    expect(content[0].buffer.toString()).to.be.eq('das ist ein log inhalt ...\n');
  }


  @test
  async 'get log file content (directly)'() {
    const exchange = Injector.get(TasksExchange);
    const results = await exchange.getLogFile('abcdef', { filterErrors: true, skipLocal: true });
    // console.log(inspect(results, false, 10));
    expect(results).to.have.length(1);
    expect(results[0]).to.be.eq('das ist ein log inhalt ...\n');
  }


  @test
  async 'get log file path with errors - mode "responses"'() {
    const exchange = Injector.get(TasksExchange);
    const results = await exchange.getLogFilePath('abcdef2', {
      filterErrors: false,
      skipLocal: true,
      outputMode: 'responses'
    });
    expect(results).to.have.length(1);
    expect(results[0]).to.be.deep.include({
        '__nodeId__': 'remote_fakeapp01',
        'error': {
          'message': 'file for runner abcdef2 not found',
          'name': 'Error'
        },
        'instNr': 0,
        'nodeId': 'remote_fakeapp01',
        'op': 'logfile_path',
        'targetIds': [
          'fake_app'
        ]
      }
    );
  }


  @test
  async 'get task status of running task'() {
    const executor = Injector.create(TaskExecutor);
    const future = await executor
      .create(
        ['timeout_task'],
        { timeout: 3000 },
        {
          // wait for results enables future return!
          waitForRemoteResults: true,
          skipTargetCheck: true,
          remote: true
        })
      .run(true) as TaskFuture;
    await TestHelper.wait(1000);

    const exchange = Injector.get(TasksExchange);
    const duringRun = await exchange.getStatus(future.getRunnerId(), {
      filterErrors: false,
      skipLocal: true
    });

    await TestHelper.wait(1000);

    await future.await();
    await TestHelper.wait(1000);

    const afterRun = await exchange.getStatus(future.getRunnerId(), {
      filterErrors: false,
      skipLocal: true
    });


    // console.log(inspect(duringRun, false, 10));
    // console.log(inspect(afterRun, false, 10));

    expect(duringRun).to.have.length(1);
    expect(afterRun).to.have.length(1);

    expect(duringRun.shift()).to.be.deep.include({
      tasksId: future.getRunnerId(),
      taskName: 'timeout_task',
      taskNr: 0,
      state: 'running',
      callerId: 'fake_app',
      nodeId: 'remote_fakeapp01',
      respId: 'remote_fakeapp01',
      hasError: false,
      progress: 0,
      total: 100,
      done: false,
      running: true
    });
    expect(afterRun.shift()).to.be.deep.include({
      tasksId: future.getRunnerId(),
      taskName: 'timeout_task',
      taskNr: 0,
      state: 'stopped',
      callerId: 'fake_app',
      nodeId: 'remote_fakeapp01',
      respId: 'remote_fakeapp01',
      hasError: false,
      progress: 100,
      total: 100,
      done: true,
      running: false,
      data:
        {
          results: 'test',
          incoming: { timeout: 3000 },
          outgoing: {},
          error: null
        }
    });
  }


  @test
  async 'get runners'() {
    const exchange = Injector.get(TasksExchange);

    // before running
    const beforeRunners = await exchange.getRunners({ outputMode: 'map' });

    const executor = Injector.create(TaskExecutor);
    const future = await executor
      .create(
        ['timeout_task'],
        { timeout: 3000 },
        {
          // wait for results enables future return!
          waitForRemoteResults: true,
          skipTargetCheck: true,
          remote: true
        })
      .run(true) as TaskFuture;
    await TestHelper.wait(500);

    const duringRunners = await exchange.getRunners({ outputMode: 'map' });

    await future.await();
    await TestHelper.wait(500);

    const afterRunners = await exchange.getRunners({ outputMode: 'map' });

    // console.log(inspect(beforeRunners, false, 10));
    // console.log(inspect(duringRunners, false, 10));
    // console.log(inspect(afterRunners, false, 10));
    expect(beforeRunners).to.be.deep.eq({ 'fake_app:0': [], 'remote_fakeapp01:0': [] });
    expect(afterRunners).to.be.deep.eq({ 'fake_app:0': [], 'remote_fakeapp01:0': [] });
    expect(duringRunners).to.be.deep.include({ 'fake_app:0': [] });
    expect(duringRunners['remote_fakeapp01:0'][0]).to.be.deep.include({
      state: 'running',
      callerId: 'fake_app',
      nodeId: 'remote_fakeapp01',
      targetIds: ['remote_fakeapp01']
    });
  }


  @test
  async 'get running tasks'() {
    const exchange = Injector.get(TasksExchange);

    // before running
    const beforeRunners = await exchange.getRunningTasks({ outputMode: 'map' });

    const executor = Injector.create(TaskExecutor);
    const future = await executor
      .create(
        ['timeout_task'],
        { timeout: 3000 },
        {
          // wait for results enables future return!
          waitForRemoteResults: true,
          skipTargetCheck: true,
          remote: true
        })
      .run(true) as TaskFuture;
    await TestHelper.wait(500);

    const duringRunners = await exchange.getRunningTasks({ outputMode: 'map' });

    await future.await();
    await TestHelper.wait(500);

    const afterRunners = await exchange.getRunningTasks({ outputMode: 'map' });

    // console.log(inspect(beforeRunners, false, 10));
    // console.log(inspect(duringRunners, false, 10));
    // console.log(inspect(afterRunners, false, 10));
    expect(beforeRunners).to.be.deep.eq({ 'fake_app:0': [], 'remote_fakeapp01:0': [] });
    expect(afterRunners).to.be.deep.eq({ 'fake_app:0': [], 'remote_fakeapp01:0': [] });
    expect(duringRunners['fake_app:0'][0]).to.be.deep.include({
      skipping: false,
      state: 'running',
      taskNames: ['timeout_task'],
      running: ['timeout_task'],
      finished: [],
      // nr: 0,
      nodeId: 'remote_fakeapp01'
    });
    expect(duringRunners['remote_fakeapp01:0'][0]).to.be.deep.include({
      skipping: false,
      state: 'running',
      taskNames: ['timeout_task'],
      running: ['timeout_task'],
      finished: [],
      // nr: 0,
      nodeId: 'remote_fakeapp01'
    });
  }


  @test.skip
  async 'get log file path with errors entries'() {
  }

}

