import { isBoolean } from '@typexs/generic';


// import {getMetadataArgsStorage} from 'typeorm';
// import {SystemNodeInfo} from '../../src/entities/SystemNodeInfo';
// import {TaskLog} from '../../src/entities/TaskLog';

export class TestHelper {

  static suiteName(filename: string) {
    return filename.split('/test/').pop();
  }

  static wait(ms: number) {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }

  static logEnable(set?: boolean) {
    return process.env.CI_RUN ? false : isBoolean(set) ? set : true;
  }


//   static typeOrmRestore() {
//     require('../../src/entities/SystemNodeInfo');
//     require('../../src/entities/TaskLog');
//   }
//
//   static typeOrmReset() {
// //    PlatformTools.getGlobalVariable().typeormMetadataArgsStorage = null;
//
//     const e: string[] = ['SystemNodeInfo', 'TaskLog'];
//      Object.keys(getMetadataArgsStorage()).forEach(x => {
//       remove(getMetadataArgsStorage()[x], y => y['target'] && e.indexOf(y['target'].name) === -1);
//     });
//   }

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
