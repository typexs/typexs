// process.env.SQL_LOG = '1';
import { suite, test } from '@testdeck/mocha';
import { expect } from 'chai';
import { Bootstrap, ICommand } from '../../../src';
import { Config } from '@allgemein/config';
import { join } from 'path';
import { hostname } from 'os';
import { keys, uniqBy } from 'lodash';
import { ConfigOutputCommand } from '../../../src/commands/ConfigOutputCommand';
import { Console } from '../../../src/libs/logging/Console';
import {
  LOAD_ORDER_ONLY,
  OPTIONS_ONLY,
  SCHEMA_ONLY,
  USED_FILES_ONLY,
  USED_SOURCES_ONLY,
  VALIDATE_ONLY
} from '../../../src/libs/config/Constants';
import { TestHelper } from '@typexs/testing';

let bootstrap: Bootstrap;
let commands: ICommand[] = [];
let appdir: string;

@suite('functional/config/output_command')
class ConfigOutputCommandSpec {


  static async before() {
    Bootstrap.reset();
    Config.clear();
    appdir = join(__dirname, 'app', 'commands');
    bootstrap = await Bootstrap.configure({
      app: { path: appdir },
      modules: <any>{
        disableCache: true,
        paths: TestHelper.includePaths(['base'])
      }
    });
    await bootstrap.prepareRuntime();
    await bootstrap.activateStorage();
    await bootstrap.startup();

    commands = bootstrap.getCommands();
    expect(commands.length).to.be.gt(0);
    Console.enable = false;
  }

  static async after() {
    if (bootstrap) {
      await bootstrap.shutdown();
    }
    Console.enable = true;
  }

  @test
  async 'command exists'() {
    const command = commands.find(e => e.constructor.name === ConfigOutputCommand.name);
    expect(command).to.not.be.null;
    expect(command).to.be.instanceOf(ConfigOutputCommand);
  }


  @test
  async 'generell config output'() {
    const command = commands.find(e => e.constructor.name === ConfigOutputCommand.name);
    const result = await command.handler({});
    expect(result).to.deep.eq(Config.all());
  }

  @test
  async 'config output for specific path'() {
    const command = commands.find(e => e.constructor.name === ConfigOutputCommand.name);
    const result = await command.handler({ key: 'app' });
    expect(result).to.deep.eq({
      'name': 'config-commands',
      'path': appdir
    });
  }

  @test
  async 'output config schema only'() {
    const command = commands.find(e => e.constructor.name === ConfigOutputCommand.name);
    const result = await command.handler({ [SCHEMA_ONLY]: true });
    expect(result).to.deep.include({
      '$ref': '#/definitions/Config',
      '$schema': 'http://json-schema.org/draft-07/schema#'
    });
    expect(keys(result.defintions)).to.deep.eq([]);
  }

  @test
  async 'output used config files only'() {
    const command = commands.find(e => e.constructor.name === ConfigOutputCommand.name);
    const result = await command.handler({ [USED_FILES_ONLY]: true });
    expect(result).to.deep.eq([
      {
        'dirname': join(appdir, 'config'),
        'filename': 'typexs',
        'type': 'yml'
      }
    ]);
  }


  @test
  async 'output used config options'() {
    const command = commands.find(e => e.constructor.name === ConfigOutputCommand.name);
    const result = await command.handler({ [OPTIONS_ONLY]: true });
    expect(keys(result)).to.deep.eq([
      'fileSupport',
      'configs',
      'handlers',
      'workdir'
    ]);
  }

  @test
  async 'output all config sources only'() {
    const command = commands.find(e => e.constructor.name === ConfigOutputCommand.name);
    const result = await command.handler({ [USED_SOURCES_ONLY]: true });
    expect(uniqBy(result.map((x: any) => {
      delete x.data;
      return x;
    }), x => JSON.stringify(x))).to.deep.eq([
      {
        'prefix': 'os',
        'source': 'os'
      },
      {
        'prefix': 'env',
        'source': 'env'
      },
      {
        'prefix': 'argv',
        'source': 'argv'
      },
      {
        'file': {
          'dirname': join(appdir, 'config'),
          'filename': 'typexs',
          'type': 'yml'
        },
        'prefix': undefined,
        'source': 'file'
      }
    ]);
  }

  @test
  async 'output config load order only'() {
    const command = commands.find(e => e.constructor.name === ConfigOutputCommand.name);
    const result = await command.handler({ [LOAD_ORDER_ONLY]: true });
    expect(result).to.deep.eq([
      { type: 'system', state: true },
      { type: 'file', file: '${argv.configfile}', state: false },
      { type: 'file', file: '${env.configfile}', state: false },
      {
        type: 'file',
        file: {
          dirname: join(appdir, 'config'),
          filename: 'typexs',
          type: 'yml'
        },
        namespace: 'typexs',
        pattern: [
          'typexs--' + hostname() + '',
          'typexs--${argv.nodeId}',
          'typexs--' + hostname() + '--${argv.nodeId}',
          '${app.name}/typexs',
          '${app.name}/typexs--${argv.nodeId}',
          '' + hostname() + '/typexs',
          '' + hostname() + '/typexs--${argv.nodeId}'
        ],
        standalone: false,
        interpolate: true,
        state: true
      },
      {
        type: 'file',
        file: {
          dirname: join(appdir, 'config'),
          filename: 'config-commands'
        },
        pattern: [
          'secrets',
          'secrets--' + hostname() + '',
          'secrets--${argv.nodeId}',
          'secrets--${app.nodeId}',
          'secrets--${env.nodeId}',
          'secrets--' + hostname() + '--${argv.nodeId}',
          'secrets--' + hostname() + '--${app.nodeId}',
          'secrets--' + hostname() + '--${env.nodeId}',
          '' + hostname() + '/secrets',
          'config-commands--' + hostname() + '',
          'config-commands--${argv.nodeId}',
          'config-commands--${app.nodeId}',
          'config-commands--${env.stage}',
          'config-commands--${argv.stage}',
          'config-commands--' + hostname() + '--${argv.stage}',
          'config-commands--' + hostname() + '--${env.stage}',
          'config-commands--' + hostname() + '--${argv.nodeId}',
          'config-commands--' + hostname() + '--${app.nodeId}',
          'config-commands--' + hostname() + '--${env.stage}--${argv.nodeId}',
          'config-commands--' + hostname() + '--${env.stage}--${app.nodeId}',
          'config-commands--' + hostname() + '--${argv.stage}--${argv.nodeId}',
          'config-commands--' + hostname() + '--${argv.stage}--${argv.nodeId}',
          'config-commands/typexs--' + hostname() + '--${argv.stage}--${argv.nodeId}',
          'config-commands/' + hostname() + '/typexs--${argv.stage}--${argv.nodeId}'
        ],
        state: false
      }
    ]
    );
  }

  @test
  async 'validate config schema against loaded configuration'() {
    const command = commands.find(e => e.constructor.name === ConfigOutputCommand.name);
    const result = await command.handler({ [VALIDATE_ONLY]: true });
    expect(result).to.deep.eq({
      'errors': null,
      'valid': true
    });
  }

}

