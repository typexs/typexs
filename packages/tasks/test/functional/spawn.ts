import { defaultsDeep } from 'lodash';
import { Bootstrap, ITypexsOptions } from '@typexs/base';
import { TestHelper } from '@typexs/testing';
import { TEST_STORAGE_OPTIONS } from '../../../base/test/functional/config';


export function getBootstrapForSpawn(nodeName: string, opts: any = {}) {
  const LOG_EVENT = !!process.argv.find(x => x === '--enable_log');
  let NODEID = process.argv.find(x => x.startsWith('--nodeId='));
  if (NODEID) {
    NODEID = NODEID.split('=').pop();
  } else {
    NODEID = nodeName;
  }

  return Bootstrap
    .setConfigSources([{ type: 'system' }])
    .configure(defaultsDeep(opts, <ITypexsOptions & any>{
      app: { name: NODEID, nodeId: NODEID, path: __dirname },
      logging: { enable: LOG_EVENT, level: 'debug' },
      modules: {
        paths: [
          TestHelper.root()
        ],
        disableCache: true,
        include: [
          '**/@allgemein{,/eventbus}*',
          '**/@typexs{,/base}*',
          '**/@typexs{,/server}*',
          '**/@typexs{,/tasks}*',
          '**/' + nodeName + '*',
          '**/scenario/' + nodeName + '*'
        ]
      },
      storage: { default: TEST_STORAGE_OPTIONS  }
    }));

}
