import { Bootstrap, ITypexsOptions } from '@typexs/base';
import { SPAWN_TIMEOUT } from './Constants';
import { Config } from '@allgemein/config';
import { TestHelper } from './TestHelper';
import { defaultsDeep } from 'lodash';

/**
 * Helper to create an parallel running node instance for distributed functionality or interaction tests.
 */
export class TypeXsInstance {
  configSource: any = [{ type: 'system' }];

  config: ITypexsOptions & any = {};

  _nodeId: string = 'txs-app';


  constructor(nodeId: string) {
    this._nodeId = nodeId;
    const NODEID = process.argv.find(x => x.startsWith('--nodeId='));
    if (NODEID) {
      this._nodeId = NODEID.split('=').pop();
    }
  }

  configure(config: ITypexsOptions & any = {}) {
    defaultsDeep(config, {
      app: { name: this._nodeId, nodeId: this._nodeId },
      logging: {
        enable: TypeXsInstance.enabledLog(),
        level: 'debug',
        loggers: [{ name: '*', level: 'debug' }]
      }
    });
    this.config = config;
    return this;
  }


  static enabledLog() {
    return !!process.argv.find(x => x === '--enable_log');
  }


  async run() {
    let bootstrap = Bootstrap
      .setConfigSources(this.configSource)
      .configure(this.config);
    bootstrap.activateLogger();
    bootstrap.activateErrorHandling();
    await bootstrap.prepareRuntime();
    bootstrap = await bootstrap.activateStorage();
    bootstrap = await bootstrap.startup();
    process.send('startup');
    const timeout = parseInt(Config.get('argv.timeout', SPAWN_TIMEOUT), 10);


    const t = setTimeout(async () => {
      await bootstrap.shutdown();
    }, timeout);

    let running = true;
    process.on(<any>'message', async (m: string) => {

      if (m === 'shutdown') {
        running = false;
        clearTimeout(t);
        await bootstrap.shutdown();
        process.exit(0);
      }
    });
    process.on('exit', async () => {
      if (running) {
        running = false;
        clearTimeout(t);
        await bootstrap.shutdown();
      }
    });


  }
}
