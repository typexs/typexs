import * as _ from 'lodash';
import { getMetadataArgsStorage } from 'typeorm';
import { PlatformUtils } from '@allgemein/base';
import { join, resolve } from 'path';
import { Bootstrap } from '@typexs/base';

export class TestHelper {

  // static suiteName(filename: string) {
  //   return filename.split('/test/').pop();
  // }


  static async bootstrap(cfg: any, sources: any = [{ type: 'system' }]) {
    const bootstrap = Bootstrap
      .setConfigSources(sources)
      .configure(cfg);

    bootstrap.activateErrorHandling();
    bootstrap.activateLogger();
    await bootstrap.prepareRuntime();
    await bootstrap.activateStorage();
    await bootstrap.startup();
    return bootstrap;
  };

  static root() {
    return resolve(__dirname + '/../../../..');

  }

  static includePaths(module = 'base') {
    const root = this.root();
    return [
      join(root, 'packages', module),
      join(root, 'node_modules', '@allgemein')
    ];
  }

  static async clearCache() {
    if (PlatformUtils.fileExist('/tmp/.txs/cache')) {
      await PlatformUtils.deleteDirectory('/tmp/.txs/cache');
    }
  }

  static wait(ms: number) {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }

  static logEnable(set?: boolean) {
    return process.env.CI_RUN ? false : _.isBoolean(set) ? set : true;
  }


  static typeOrmRestore() {
    require('@typexs/base/entities/SystemNodeInfo');
    require('@typexs/base/entities/TaskLog');
  }

  static typeOrmReset() {
    const e: string[] = ['SystemNodeInfo', 'TaskLog'];
    _.keys(getMetadataArgsStorage()).forEach(x => {
      _.remove(getMetadataArgsStorage()[x], y => y['target'] && e.indexOf(y['target'].name) === -1);
    });
  }

  static waitFor(fn: Function, ms: number = 50, rep: number = 30) {
    return new Promise((resolve, reject) => {
      const c = 0;
      const i = setInterval(() => {
        if (c >= rep) {
          clearInterval(i);
          reject(new Error('max repeats reached ' + rep));
        }
        try {
          const r = fn();
          if (r) {
            clearInterval(i);
            resolve(null);
          }
        } catch (err) {
          clearInterval(i);
          reject(err);
        }
      }, ms);
    });
  }
}
