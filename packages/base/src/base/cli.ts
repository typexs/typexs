import 'reflect-metadata';

import { set } from 'lodash';

import { Bootstrap } from './../Bootstrap';
import { ConfigHandler } from '@allgemein/config';
import { ICommand } from '../libs/commands/ICommand';
import * as yargs from 'yargs';
import { CommandModule } from 'yargs';


export async function cli(): Promise<Bootstrap> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/ban-ts-comment
    // @ts-ignore
    const yargonaut = await import('yargonaut');
    yargonaut.style('blue')
      .style('yellow', 'required')
      .helpStyle('green')
      .errorsStyle('red');
  } catch (e) {
  }
  // todo ... make this configurable
  // process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  // need be done at this point, if not,  ConfigHandler has an undefined a

  let cfg = {};
  try {
    const idx = process.argv.findIndex(value => value === '--config');
    if (idx > -1 && process.argv.length > (idx + 1)) {
      cfg = JSON.parse(process.argv[idx + 1]);
    }
  } catch (e) {

  }

  // pass app name to initial configuration

  const idx: number[] = [];
  process.argv.map((value, index) => {
    if (value.startsWith('-D')) {
      idx.push(index);
    }
  });
  if (idx.length > 0) {
    for (const _idx of idx) {
      if (_idx > -1) {
        const key = process.argv[_idx].replace('-D', '');
        let next = null;
        if (process.argv.length > (_idx + 1)) {
          const value = process.argv[_idx + 1];
          if (!value.startsWith('-')) {
            next = value;
            process.argv.splice(_idx, 2);
          }
        } else {
          process.argv.splice(_idx, 1);
        }
        set(cfg, key, next ? next : true);
      }
    }
  }

  ConfigHandler.reload();
  const bootstrap = Bootstrap.configure(cfg);

  await bootstrap
    .activateErrorHandling()
    .prepareRuntime();
  let selectedCommand: ICommand = null;
  const yargs2 = yargs.usage('Usage: $0 <command> [options]');
  for (const command of bootstrap.getCommands(false)) {
    const c: CommandModule = {
      command: command.command,
      aliases: command.aliases,
      describe: command.describe,
      handler: () => selectedCommand = command as any
    };

    if (command.builder) {
      c.builder = command.builder.bind(command);
      // c.handler = () => selectedCommand = command;
    }
    yargs2.command(c);
  }

  try {
    const argv = yargs2.demandCommand(1, 'You need at least one command before moving on')
      .option('config', {
        alias: 'c',
        describe: 'JSON string with configuration or name of the config file.',
        'default': false
      })
      .option('verbose', {
        alias: '-v',
        describe: 'Enable logging.',
        'default': false
      })
      .coerce('verbose', (c: any) => {
        Bootstrap.verbose(c);
      })
      .help('h')
      .alias('h', 'help')
      .parse();

    if (selectedCommand) {
      bootstrap.activateLogger();
      if (selectedCommand.beforeStorage) {
        await selectedCommand.beforeStorage();
      }
      await bootstrap.activateStorage();
      await bootstrap.startup(selectedCommand);
      await bootstrap.execCommand(selectedCommand.constructor, argv);
      await bootstrap.shutdown();
    } else {
      console.log('no command!');
    }
  } catch (e) {
    console.error(e);
  }
  return bootstrap;
}
