import { suite, test, timeout } from '@testdeck/mocha';
import { Bootstrap, Config, Injector, Log } from '@typexs/base';
import * as _ from 'lodash';
import { DefaultUserLogin } from '../../../src/libs/models/DefaultUserLogin';
import { LdapAdapter } from '../../../src/adapters/auth/ldap/LdapAdapter';
import { expect } from 'chai';
import { TESTDB_SETTING, TestHelper } from '../TestHelper';
import { AuthDataContainer } from '../../../src/libs/auth/AuthDataContainer';
import { LDAP_CONFIG } from './ldap_config';
import { ldap_host, ldap_port, LOGGING } from '../config';
import { ILdapAuthOptions } from '../../../src/adapters/auth/ldap/ILdapAuthOptions';


process.setMaxListeners(1000);
const settingsTemplate = {
  logging: LOGGING,
  storage: {
    default: TESTDB_SETTING
  },
  auth: {
    methods: {
      default: <ILdapAuthOptions>{
        type: 'ldap',
        url: 'ldap://' + ldap_host + ':' + ldap_port
      }
    }
  },
  modules: {
    paths: [
      TestHelper.root()
    ]
  }
};


let bootstrap: Bootstrap = null;

@suite('functional/ldap/auth_ldap_adapter')
class AuthLdapAdapterSpec {

  static async before() {

  }


  static async after() {
    // await web.stop();
    if (bootstrap) {
      await bootstrap.shutdown();
    }
    Bootstrap.reset();
  }


  @test
  async 'authenticate by user search through admin bind'() {
    const settings = _.clone(settingsTemplate);
    settings.auth.methods.default = _.clone(LDAP_CONFIG);

    const ref = await TestHelper.bootstrap_auth('default', settings);
    bootstrap = ref.bootstrap;

    const adapter = Injector.get(LdapAdapter);
    await adapter.prepare(Config.get('auth.methods.default'));

    expect(adapter.hasRequirements()).to.be.true;
    // Log.info('adapter ready');

    // success  login
    let login = new DefaultUserLogin();
    login.username = 'billy';
    login.password = 'password';
    let container = new AuthDataContainer(login);

    let success = await adapter.authenticate(container);
    // Log.info(success, container);
    expect(success).to.be.true;


    // failed  login
    login = new DefaultUserLogin();
    login.username = 'billyy';
    login.password = 'password';
    container = new AuthDataContainer(login);

    success = await adapter.authenticate(container);
    // Log.info(success, container);
    expect(success).to.be.false;

    // failed  login
    login = new DefaultUserLogin();
    login.username = 'billy';
    login.password = 'password2';
    container = new AuthDataContainer(login);

    success = await adapter.authenticate(container);
    expect(success).to.be.false;

  }


}
