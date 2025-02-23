// process.env.SQL_LOG = "1";
import { suite, test } from '@testdeck/mocha';
import { expect } from 'chai';
import * as path from 'path';
import { Bootstrap, C_STORAGE_DEFAULT, StorageRef } from '@typexs/base';
import { Config } from '@allgemein/config';
import { TaskCommand } from '../../src/commands/TaskCommand';
import { TEST_STORAGE_OPTIONS } from '../../../base/test/functional/config';
import { Container } from 'typedi';
import { TaskLog } from '../../src/entities/TaskLog';
import { LockFactory } from '@allgemein/base';
import { TestHelper } from '@typexs/testing';


const stdMocks = require('std-mocks');

let bootstrap: Bootstrap;

@suite('functional/commands/tasks')
class Task_commandSpec {


  static async before() {
    Bootstrap.reset();
    Config.clear();


    const appdir = path.join(__dirname, 'commands/app');
    bootstrap = await Bootstrap
      .setConfigSources([{ type: 'system' }])
      .configure({
        // logging: {
        //   level: 'debug', enable: true,
        //   transports: [{console: {}}],
        //   loggers: [{name: '*', level: 'debug'}]
        // },
        app: { path: appdir },
        storage: { default: TEST_STORAGE_OPTIONS },
        modules: TestHelper.modulSettings(['base', 'tasks'])// && { paths: [TestHelper.root()] }
        // workers: {access: [{name: 'TaskMonitorWorker', access: 'allow'}]}
      });
    bootstrap.activateLogger();
    bootstrap.activateErrorHandling();
    await bootstrap.prepareRuntime();
    await bootstrap.activateStorage();
    await bootstrap.startup();
  }


  static async after() {
    if (bootstrap) {
      await bootstrap.shutdown();
    }
  }


  @test
  async 'task command registered'() {
    const commands = bootstrap.getCommands();
    const command = commands.find(x => x instanceof TaskCommand);
    expect(command).to.exist;
    expect((<TaskCommand>command).command).to.eq('task');
  }


  @test
  async 'list tasks'() {
    Config.set('argv.local', true, 'system');
    const commands = bootstrap.getCommands();
    const command = commands.find(x => x instanceof TaskCommand);
    stdMocks.use();
    await command.handler({});
    stdMocks.restore();
    const results = stdMocks.flush();
    expect(results.stdout).to.have.length(2);
    expect(results.stdout[1]).to.contain('test\n');
  }


  @test
  async 'exec tasks'() {
    Config.set('argv.local', true, 'system');
    const commands = bootstrap.getCommands();
    const command = commands.find(x => x instanceof TaskCommand);
    process.argv = ['blabla', 'task', 'test', '--someValue=test'];
    stdMocks.use();
    await command.handler({});
    stdMocks.restore();

    const results = stdMocks.flush();
    expect(results.stdout).to.have.length.gt(0);
    expect(results.stdout.find(x => /("|')name("|'):\s*("|')test("|')/.test(x) && /("|')progress("|'):\s*100/.test(x))).to.exist;
    await LockFactory.$().await();
    const ref: StorageRef = Container.get(C_STORAGE_DEFAULT);
    const res = await ref.getController().find(TaskLog);
    expect(res).to.have.length(1);
    expect((<any>res[0]).state).to.eq('stopped');
  }

}

