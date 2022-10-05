import { ILdapStorageRefOptions } from '../../../src/lib/storage/ILdapStorageRefOptions';
import { C_LDAP } from '../../../src/lib/Constants';
import { Bootstrap } from '@typexs/base';
import path from 'path';
import { TestHelper } from '@typexs/testing';
let bootstrap: Bootstrap = null;


const appdir = path.join(__dirname, 'app');
const resolve = TestHelper.root();
export const CONFIG_01 = {
  app: { path: appdir },
  modules: {
    paths: [resolve],
      disableCache: true
  },
  logging: {
    enable: false,
    level: 'debug',
    transports: [
      {
        console: {}
      }
    ]
  },
  storage: {
    ldap: <ILdapStorageRefOptions>{
      framework: C_LDAP,
    }
  }
}
