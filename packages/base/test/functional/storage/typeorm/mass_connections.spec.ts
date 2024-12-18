import { range } from '@typexs/generic';


import { suite, test } from '@testdeck/mocha';
import { expect } from 'chai';
import { Config } from '@allgemein/config';
import { Bootstrap } from '../../../../src/Bootstrap';
import { TypeOrmStorageRef } from '../../../../src/libs/storage/framework/typeorm/TypeOrmStorageRef';
import { EVENT_STORAGE_REF_PREPARED, EVENT_STORAGE_REF_SHUTDOWN } from '../../../../src/libs/storage/framework/typeorm/Constants';
import { postgres_host, postgres_port } from '../../config';
import { TestHelper } from '../../../../../testing/src';


let bootstrap: Bootstrap;

@suite('functional/storage/typeorm/mass_connections')
class StorageGeneralSpec {


  before() {
    Bootstrap.reset();
    Config.clear();
  }


  async after() {
    if (bootstrap) {
      await bootstrap.shutdown();
    }
  }


  @test
  async 'mass connections on psql'() {
    bootstrap = await Bootstrap.setConfigSources([{ type: 'system' }]).configure({
      app: { path: '.' },
      modules: {
        paths: TestHelper.includePaths(),
        include: [
          '**/@typexs/base/**'
        ]
      },
      storage: {
        default: {
          synchronize: true,
          type: 'postgres',
          database: 'txsbase',
          username: 'txsbase',
          password: '',
          host: postgres_host,
          port: postgres_port

        } as any
      }
    }).prepareRuntime();
    bootstrap = await bootstrap.activateStorage();

    const storageManager = bootstrap.getStorage();
    const storage: TypeOrmStorageRef = storageManager.get();

    const connections = [];
    for (const i of range(0, 1001)) {
      const c = await storage.connect();
      // console.log(i + ' ' + storage.listenerCount(EVENT_STORAGE_REF_PREPARED) + ' ' + storage.listenerCount(EVENT_STORAGE_REF_SHUTDOWN));
      connections.push(c);
    }

    await Promise.all(connections.map(x => x.close()));
    expect(storage.listenerCount(EVENT_STORAGE_REF_PREPARED)).to.be.eq(0);
    expect(storage.listenerCount(EVENT_STORAGE_REF_SHUTDOWN)).to.be.eq(0);

  }

}

