import { redis_host, redis_port, SPAWN_TIMEOUT, TEST_STORAGE_OPTIONS } from '../../config';
import { IEventBusConfiguration } from '@allgemein/eventbus';
import { ITypexsOptions } from '../../../../src/libs/ITypexsOptions';
import { TestHelper, TypeXsInstance } from '@typexs/testing';


new TypeXsInstance('fakeapp01').configure(<ITypexsOptions & any>{
  app: { path: __dirname },
  modules: { paths: TestHelper.includePaths() },
  storage: { default: TEST_STORAGE_OPTIONS },
  eventbus: { default: <IEventBusConfiguration>{ adapter: 'redis',
      extra: { host: redis_host, port: redis_port, unref: true } } }
}).run();
