// process.env.SQL_LOG = '1';
import { expect } from 'chai';
import { Bootstrap, Injector, ITypexsOptions } from '@typexs/base';
import { suite, test } from '@testdeck/mocha';
import { TEST_STORAGE_OPTIONS } from './config';
import { Access } from '../../src/libs/Access';
import { PermissionsRegistry } from '../../src';
import { BasicPermission, IPermissions, IRole, IRolesHolder } from '@typexs/roles-api';
import { TestHelper } from './TestHelper';

let bootstrap: Bootstrap;
let inc = 0;
const LOG_EVENT = TestHelper.logEnable(false);

const INCLUDES = ['**/@allgemein{,/eventbus}*',
  '**/@typexs{,/base}*',
  '**/@typexs{,/server}*',
  '**/@typexs{,/entity}*',
  '**/@typexs{,/roles-api}*',
  '**/@typexs{,/roles}*'
];


@suite('functional/access')
class AccessSpec {


  static async before() {
    bootstrap = Bootstrap
      .setConfigSources([{ type: 'system' }])
      .configure(<ITypexsOptions & any>{
        // app: {name: 'test', nodeId: 'worker'},
        logging: { enable: LOG_EVENT, level: 'debug' },
        modules: {
          paths: [
            __dirname + '/../../../..'
          ],
          disableCache: true,
          include: INCLUDES

        },
        storage: { default: TEST_STORAGE_OPTIONS }
        // workers: {access: [{name: 'TaskMonitorWorker', access: 'allow'}]}
      });
    bootstrap.activateLogger();
    bootstrap.activateErrorHandling();
    await bootstrap.prepareRuntime();
    bootstrap = await bootstrap.activateStorage();
    bootstrap = await bootstrap.startup();

    const registry: PermissionsRegistry = Injector.get(PermissionsRegistry.NAME);

    const c: IPermissions = {
      permissions() {
        return [
          new BasicPermission('*'),
          new BasicPermission('have a * day'),
          new BasicPermission('have a nice day'),
          new BasicPermission('have a nice next day'),
          new BasicPermission('nice next day access')
        ];
      }
    };

    await registry.loadFrom([c]);
  }


  static async after() {
    if (bootstrap) {
      await bootstrap.shutdown();
      Bootstrap.reset();
    }
  }


  @test
  async 'access validation for single'() {
    const access: Access = Injector.create(Access);
    const user: IRolesHolder = {
      getIdentifier(): string {
        return 'user-' + inc++;
      },
      getRoles(): IRole[] {
        return [
          {
            role: 'hallo',
            label: 'Hallo',
            permissions: [
              {
                permission: 'have a good day'
              },
              {
                permission: 'have a nice day'
              }
            ]
          }
        ];
      }
    };

    const user_2: IRolesHolder = {
      getIdentifier(): string {
        return 'user-' + inc++;
      },
      getRoles(): IRole[] {
        return [
          {
            role: 'hallo2',
            label: 'Hallo2',
            permissions: [
              {
                permission: 'have a nice next day'
              },
              {
                permission: 'have a nice day'
              }
            ]
          }
        ];
      }
    };


    // cause is not registed
    let allowed = await access.validate(user, 'have a day');
    expect(allowed).to.be.false;

    allowed = await access.validate(user, 'have a nice day');
    expect(allowed).to.be.true;

    allowed = await access.validate(user, 'have a nice next day');
    expect(allowed).to.be.false;

    allowed = await access.validate(user, ['have a nice day', 'have a nice next day']);
    expect(allowed).to.be.true;

    allowed = await access.validate(user, ['have a nice day', 'have a nice next day'], 'all');
    expect(allowed).to.be.false;

    allowed = await access.validate(user_2, ['have a nice day', 'have a nice next day']);
    expect(allowed).to.be.true;

    allowed = await access.validate(user_2, ['have a nice day', 'have a nice next day'], 'all');
    expect(allowed).to.be.true;

    allowed = await access.validate(user, ['have a nice next day']);
    expect(allowed).to.be.false;

    allowed = await access.validate(user, ['have a nice day']);
    expect(allowed).to.be.true;
  }


  @test
  async 'access by pattern'() {
    const user: IRolesHolder = {
      getIdentifier(): string {
        return 'user-' + inc++;
      },
      getRoles(): IRole[] {
        return [{
          role: 'secure',
          label: 'Secure',
          permissions: ['*']
        }];
      }
    };

    const access: Access = Injector.create(Access);
    let allowed = await access.validate(user, ['have a nice day']);
    expect(allowed).to.be.true;

    allowed = await access.validate(user, ['have a nice next day']);
    expect(allowed).to.be.true;

    allowed = await access.validate(user, ['nice next day access']);
    expect(allowed).to.be.true;

    allowed = await access.validate(user, ['have a nice next day', 'have a nice day']);
    expect(allowed).to.be.true;

    allowed = await access.validate(user, ['have a nice next day', 'have a nice day', 'nice next day access']);
    expect(allowed).to.be.true;
  }

  @test
  async 'access by pattern part'() {
    const user: IRolesHolder = {
      getIdentifier(): string {
        return 'user-' + inc++;
      },
      getRoles(): IRole[] {
        return [{
          role: 'secure',
          label: 'Secure',
          permissions: [
            {
              permission: 'have a * day'
            }
          ]
        }];
      }
    };
    const access: Access = Injector.create(Access);
    let allowed = await access.validate(user, ['have a nice day']);
    expect(allowed).to.be.true;

    allowed = await access.validate(user, ['have a nice next day']);
    expect(allowed).to.be.true;

    allowed = await access.validate(user, ['nice next day access']);
    expect(allowed).to.be.false;

    allowed = await access.validate(user, ['have a nice next day', 'have a nice day']);
    expect(allowed).to.be.true;

    allowed = await access.validate(user, ['have a nice next day', 'have a nice day', 'nice next day access']);
    expect(allowed).to.be.true;

    allowed = await access.validate(user, ['have a nice next day', 'have a nice day', 'nice next day access'], 'all');
    expect(allowed).to.be.false;
  }


  @test.skip
  async 'access with predefined handle'() {

  }

  @test.skip
  async 'access of secured resource'() {

  }

  @test.skip
  async 'hide/show object fields'() {

  }
}
