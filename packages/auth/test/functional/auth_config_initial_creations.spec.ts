import * as _ from 'lodash';
import { suite, test } from '@testdeck/mocha';
import { Bootstrap, Injector, Invoker } from '@typexs/base';
import { expect } from 'chai';
import { User } from '../../src/entities/User';
import { TESTDB_SETTING, TestHelper } from './TestHelper';
import { ITypexsOptions } from '@typexs/base/libs/ITypexsOptions';
import { AuthHelper } from '../../src/libs/auth/AuthHelper';
import { AuthManager } from '../../src';
import { EntityController } from '@typexs/entity';
import { IEntityRef, IPropertyRef } from '@allgemein/schema-api';

let bootstrap: Bootstrap = null;
const logValue = TestHelper.logEnable(false);

@suite('functional/auth_config_initial_creations')
class AuthConfigInitialCreationSpec {


  static async before() {
    Bootstrap.reset();
    bootstrap = Bootstrap
      .setConfigSources([{ type: 'system' }])
      .configure(<ITypexsOptions & any>{
        // app: {name: 'test', nodeId: 'worker'},
        logging: { enable: logValue, level: 'debug' },
        // modules: {paths: [__dirname + '/../../..']},
        modules: { paths: [TestHelper.root()] },
        storage: {
          default: TESTDB_SETTING
        },
        auth: {
          // allowSignup: true,
          methods: {
            default: {
              type: 'database'
            }
          }
        },
        initialise: {
          roles: [
            {
              role: 'admin',
              label: 'Admin',
              permissions: ['*']
            },
            {
              role: 'user',
              label: 'User',
              permissions: [
                'allow see profile',
                'allow edit profile'
              ]
            }
          ]
        }
      });
    bootstrap.activateLogger();
    bootstrap.activateErrorHandling();
    await bootstrap.prepareRuntime();
    bootstrap = await bootstrap.activateStorage();
    bootstrap = await bootstrap.startup();
  }


  static async after() {
    if (bootstrap) {
      await bootstrap.shutdown();
    }
    Bootstrap.reset();
  }


  @test
  async 'init first users'() {
    const invoker = Injector.get(Invoker.NAME) as Invoker; // await AuthHelper.initRoles(xsem, opts.auth.initRoles);
    const entityController = Injector.get('EntityController.default') as EntityController;
    const authManager = Injector.get(AuthManager.NAME) as AuthManager;
    const initUsers = [
      {
        username: 'admin',
        adapter: 'default',
        mail: 'admin@localhost.local',
        password: 'admin123',
        roles: ['admin']
      }
    ];

    let users = await AuthHelper.initUsers(invoker, entityController, authManager, initUsers);
    expect(users).to.have.length(1);
    expect(users[0].getRoles()).to.have.length(1);
    expect(users[0].getRoles()[0].role).to.be.eq('admin');

    users = await AuthHelper.initUsers(invoker, entityController, authManager, initUsers);
    expect(users).to.have.length(0);

    users = await entityController.find(User, null, { limit: 0 });
    expect(users).to.have.length(1);
    expect(users[0].getRoles()).to.have.length(1);
    expect(users[0].getRoles()[0].role).to.be.eq('admin');

    // return user with role and permissions

    const user = await entityController.findOne(User, { id: users[0].id }, {
      hooks: {
        abortCondition:
          (
            entityRef: IEntityRef,
            propertyDef: IPropertyRef,
            results: any,
            op: any
          ) => op.entityDepth > 1
      }
    });

    const perms = _.concat([], ...user.getRoles().map(role => role.permissions));
    expect(perms).to.have.length(1);
    expect(perms.map(x => x.permission)).to.be.deep.eq(['*']);

  }
}

