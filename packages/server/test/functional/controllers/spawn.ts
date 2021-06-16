import {defaultsDeep} from 'lodash';
import {Bootstrap, ITypexsOptions} from '@typexs/base';
import {TEST_STORAGE_OPTIONS} from '../config';


export function getBootstrapForSpawn(nodeName: string, opts: any = {}) {
  const LOG_EVENT = !!process.argv.find(x => x === '--enable_log');
  let NODEID = process.argv.find(x => x.startsWith('--nodeId='));
  if (NODEID) {
    NODEID = NODEID.split('=').pop();
  } else {
    NODEID = nodeName;
  }

  return Bootstrap
    .setConfigSources([{type: 'system'}])
    .configure(defaultsDeep(opts, <ITypexsOptions & any>{
      app: {name: NODEID, nodeId: NODEID, path: __dirname},
      logging: {enable: LOG_EVENT, level: 'debug'},
      modules: {
        paths: [
          __dirname + '/../../../..'
        ],
        disableCache: true,
        include: [
          '**/packages/base**',
          '**/packages/server**'
        ],
      },
      storage: {default: TEST_STORAGE_OPTIONS}
    }));

}
