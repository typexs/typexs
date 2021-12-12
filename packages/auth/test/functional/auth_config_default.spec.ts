import { suite, test, timeout } from '@testdeck/mocha';
import { expect } from 'chai';
import { Bootstrap, Injector, ITypexsOptions } from '@typexs/base';

import { Auth } from '../../src/middleware/Auth';
import { User } from '../../src/entities/User';
import { TEST_STORAGE_OPTIONS } from './config';
import { TestHelper } from './TestHelper';

let bootstrap: Bootstrap;
const logValue = TestHelper.logEnable(false);

@suite('functional/auth_config_default')
class AuthConfigSpec {


  async after() {
    if (bootstrap) {
      await bootstrap.shutdown();
    }
    Bootstrap.reset();
  }


  @test
  async 'auth config'() {
    const settings = <ITypexsOptions & any>{
      // app: {name: 'test', nodeId: 'worker'},
      logging: { enable: logValue, level: 'debug' },
      modules: { paths: [TestHelper.root()] },
      storage: { default: TEST_STORAGE_OPTIONS },
      // workers: {access: [{name: 'TaskMonitorWorker', access: 'allow'}]},
      auth: {
        userClass: User, // ./User as string
        methods: {
          default: {
            type: 'database'
          }
        }
      }
    };
    bootstrap = await TestHelper.bootstrap_basic(settings);

    const auth = Injector.get(Auth);
    await auth.prepare({});

    const adapters = auth.getManager().getDefinedAdapters();
    const authMethods = auth.getUsedAuthMethods();

    expect(adapters.map(x => x.name)).to.contains('database');
    expect(adapters.map(x => x.className)).to.contains('DatabaseAdapter');
    expect(authMethods.map(x => x.authId)).to.deep.eq(['default']);

  }
}

