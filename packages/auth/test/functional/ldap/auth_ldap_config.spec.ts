import { suite, test } from '@testdeck/mocha';
import { expect } from 'chai';
import { Bootstrap, Injector, ITypexsOptions } from '@typexs/base';

import { Auth } from '../../../src/middleware/Auth';
import { User } from '../../../src/entities/User';
import { TestHelper } from '../TestHelper';
import { LOGGING, TEST_STORAGE_OPTIONS } from '../config';

let bootstrap: Bootstrap;

@suite('functional/ldap/auth_ldap_config')
class AuthLdapConfigSpec {

  //
  // before() {
  //   Config.clear();
  //   Container.reset();
  // }


  async after() {
    if (bootstrap) {
      await bootstrap.shutdown();
      Bootstrap.reset();
    }
  }

  @test
  async 'ldap integration'() {

    bootstrap = await TestHelper.bootstrap_basic(<ITypexsOptions & any>{
      // app: {name: 'test', nodeId: 'worker'},
      logging: LOGGING,
      // modules: {paths: [__dirname + '/../../..']},
      storage: { default: TEST_STORAGE_OPTIONS },
      auth: {
        userClass: User, // ./User as string
        methods: {
          default: {
            type: 'ldap'

          }
        }
      },
      modules: {
        paths: [
          TestHelper.root()
        ]
      }
    });


    const auth = Injector.get(Auth);
    // await auth.prepare({});

    const adapters = auth.getManager().getDefinedAdapters();
    const authMethods = auth.getUsedAuthMethods();
    const authMethodsInfo = auth.getSupportedMethodsInfos();

    expect(adapters.map(x => x.name)).to.contain('ldap');
    expect(adapters.map(x => x.className)).to.contain('LdapAdapter');
    expect(authMethods.map(x => x.authId)).to.deep.eq(['default']);
    expect(authMethodsInfo.map(x => x.label)).to.deep.eq(['Default']);

    // storage.getNames().map(x => storage.get(x).shutdown());
  }
}

