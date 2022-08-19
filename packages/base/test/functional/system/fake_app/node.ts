import { SPAWN_TIMEOUT, TEST_STORAGE_OPTIONS } from '../../config';
import { IEventBusConfiguration } from '@allgemein/eventbus';
import { ITypexsOptions } from '../../../../src/libs/ITypexsOptions';
import { TestHelper, TypeXsInstance } from '@typexs/testing';


new TypeXsInstance('fakeapp01').configure(<ITypexsOptions & any>{
  app: { path: __dirname },
  modules: { paths: TestHelper.includePaths() },
  storage: { default: TEST_STORAGE_OPTIONS },
  eventbus: { default: <IEventBusConfiguration>{ adapter: 'redis', extra: { host: '127.0.0.1', port: 6379, unref: true } } }
}).run();
