import { suite, test, timeout } from '@testdeck/mocha';
import { __CLASS__, __REGISTRY__, Bootstrap, C_STORAGE_DEFAULT, Config, Injector, ITypexsOptions, StorageRef } from '@typexs/base';
import {
  API_CTRL_STORAGE_AGGREGATE_ENTITY,
  API_CTRL_STORAGE_DELETE_ENTITIES_BY_CONDITION,
  API_CTRL_STORAGE_DELETE_ENTITY,
  API_CTRL_STORAGE_FIND_ENTITY,
  API_CTRL_STORAGE_GET_ENTITY,
  API_CTRL_STORAGE_METADATA_ALL_ENTITIES,
  API_CTRL_STORAGE_METADATA_ALL_STORES,
  API_CTRL_STORAGE_METADATA_GET_ENTITY,
  API_CTRL_STORAGE_METADATA_GET_STORE,
  API_CTRL_STORAGE_SAVE_ENTITY,
  API_CTRL_STORAGE_UPDATE_ENTITIES_BY_CONDITION,
  API_CTRL_STORAGE_UPDATE_ENTITY,
  PERMISSION_ALLOW_ACCESS_STORAGE_ENTITY_PATTERN
} from '../../../src/lib/Constants';
import { DEFAULT_ANONYMOUS, K_ROUTE_CONTROLLER, Server } from '@typexs/server';
import { expect } from 'chai';

import { Driver } from './fake_app_storage/entities/Driver';
import { TEST_STORAGE_OPTIONS } from '../config';
import { HttpFactory, IHttp } from '@allgemein/http';
import { Car } from './fake_app_storage/entities/Car';
import { RandomData } from './fake_app_storage/entities/RandomData';
import { Action } from 'routing-controllers';
import { SecuredObject } from './fake_app_storage/entities/SecuredObject';
import { BasicPermission, IRole, IRolesHolder } from '@typexs/roles-api';
import { IStorageRefMetadata } from '../../../src/lib/storage_api/IStorageRefMetadata';
import { IJsonSchema7 } from '@allgemein/schema-api';
import { TestHelper } from '@typexs/testing';
import { clone, snakeCase } from '@typexs/generic';


let permissionsCheck = false;

const settingsTemplate: ITypexsOptions & any = {
  storage: {
    default: TEST_STORAGE_OPTIONS
  },

  app: {
    name: 'demo',
    path: __dirname + '/fake_app_storage'
  },


  modules: {
    paths: [
      TestHelper.root()
    ],
    disableCache: true,
    include: [
      '**/@allgemein{,/eventbus}*',
      '**/@typexs{,/base}*',
      '**/@typexs{,/server}*',
      '**/@typexs{,/storage}*'
    ]

  },

  logging: {
    enable: false,
    level: 'debug',
    transports: [{ console: {} }]
  },

  server: {
    default: {
      type: 'web',
      framework: 'express',
      host: 'localhost',
      port: 4500,

      routes: [{
        type: K_ROUTE_CONTROLLER,
        context: 'api',
        routePrefix: 'api',

        authorizationChecker: (action: Action, roles: any[]) => {
          if (!permissionsCheck) {
            return true;
          }
          return true;

        },

        currentUserChecker: (action: Action) => {
          if (!permissionsCheck) {
            return DEFAULT_ANONYMOUS;
          }
          return <IRolesHolder>{
            getRoles(): IRole[] {
              return <IRole[]>[
                <IRole>{
                  permissions: [
                    new BasicPermission(PERMISSION_ALLOW_ACCESS_STORAGE_ENTITY_PATTERN.replace(':name', snakeCase(RandomData.name)))
                  ]
                }
              ];
            }
          };
        }
      }]
    }
  }
};

let bootstrap: Bootstrap = null;
let server: Server = null;
let http: IHttp = null;

const carList = [
  'Volvo', 'Renault', 'Ford', 'Suzuki', 'BMW', 'VW',
  'GM', 'Audi', 'Mercedes', 'Tesla', 'Aston Martin'
];
let URL: string = null;
let defaultStorageRef: StorageRef = null;

@suite('functional/controllers/storage_api_controller')
@timeout(300000)
// tslint:disable-next-line:class-name
class Storage_api_controllerSpec {


  static async before() {
    Bootstrap.reset();
    const settings = clone(settingsTemplate);
    http = HttpFactory.create();

    bootstrap = Bootstrap
      .setConfigSources([{ type: 'system' }])
      .configure(settings)
      .activateErrorHandling()
      .activateLogger();

    await bootstrap.prepareRuntime();
    await bootstrap.activateStorage();
    await bootstrap.startup();

    server = Injector.get('server.default');
    URL = server.url();
    await server.start();


    /**
     * generate test data
     */
    defaultStorageRef = Injector.get(C_STORAGE_DEFAULT) as StorageRef;
    const entries = [];
    const cars = [];
    const d = new Date();
    for (let i = 1; i < 11; i++) {
      const randomData = new RandomData();
      randomData.id = i;
      randomData.numValue = i * 100;
      randomData.floatValue = i * 0.893;
      randomData.bool = i % 2 === 0;
      randomData.date = new Date(2020, i, i * 2, 0, 0, 0);
      randomData.short = 'short name ' + i;
      randomData.long = 'long long long very long '.repeat(i * 5);
      entries.push(randomData);

      let driver, driver2, driver3: Driver;
      const carName = carList[i];
      const car = new Car();
      car.name = carName;
      cars.push(car);
      switch (i % 3) {
        case 0:
          driver = new Driver();
          driver.firstName = carList[i] + ' firstname driver 1 ' + (i % 3);
          driver.lastName = carList[i] + ' lastname driver 1 ' + (i % 3);
          driver.car = car;
          entries.push(driver);
          break;
        case 1:
          driver2 = new Driver();
          driver2.firstName = carList[i] + ' firstname driver 1 ' + (i % 3);
          driver2.lastName = carList[i] + ' lastname driver 1 ' + (i % 3);
          driver2.car = car;
          driver3 = new Driver();
          driver3.firstName = carList[i] + ' firstname driver 2 ' + (i % 3);
          driver3.lastName = carList[i] + ' lastname driver 2 ' + (i % 3);
          driver3.car = car;
          entries.push(driver2, driver3);
          break;
        case 2:
          break;
      }
    }
    await defaultStorageRef.getController().save(cars);
    await defaultStorageRef.getController().save(entries);
  }

  static async after() {
    if (server) {
      await server.stop();
    }
    await bootstrap.getStorage().shutdown();
    await bootstrap.shutdown();
    Bootstrap.reset();
    Injector.reset();
    Config.clear();
  }

  async before() {
    // delete + create dummy data
    await defaultStorageRef.getController().remove(RandomData, { id: { $gt: 10 } });
  }

  @test
  async 'list storages'() {
    const url = server.url();
    let res: any = await http.get(url + '/api' + API_CTRL_STORAGE_METADATA_ALL_STORES, { responseType: 'json' });
    expect(res).to.not.be.null;
    res = res.body as IStorageRefMetadata[];
    expect(res).to.have.length(1);
    const keyNames =  Object.keys(res[0].schema.definitions);
    expect(keyNames).to.have.length(5);
    expect(keyNames).to.contain.members(['Driver', 'Car']);
    const driver = res[0].schema.definitions.Driver;
    const propertyNames =  Object.keys(driver.properties);
    expect(propertyNames).to.have.length(4);
    expect(propertyNames).to.be.deep.eq(['id', 'firstName', 'lastName', 'car']);
  }


  @test
  async 'list storage default'() {
    const url = server.url();
    let res: any = await http.get(url + '/api' +
      API_CTRL_STORAGE_METADATA_GET_STORE.replace(':name', 'default'), { responseType: 'json' });
    // console.log(inspect(res, false, 10));
    expect(res).to.not.be.null;
    res = res.body as IStorageRefMetadata;
    expect(res).to.exist;
    expect(res.name).to.be.eq('default');
    expect( Object.keys(res.schema.definitions)).to.have.length(5);
    expect( Object.keys(res.schema.definitions)).to.contain.members(['Driver', 'Car']);
    const driver = res.schema.definitions.Driver;
    expect( Object.keys(driver.properties)).to.have.length(4);
    expect( Object.keys(driver.properties)).to.be.deep.eq(['id', 'firstName', 'lastName', 'car']);
  }


  @test
  async 'list all entities'() {
    const url = server.url();
    let res: any = await http.get(url + '/api' +
      API_CTRL_STORAGE_METADATA_ALL_ENTITIES, { responseType: 'json' });
    expect(res).to.not.be.null;
    res = res.body as IJsonSchema7[];
    expect(res).to.have.length(1);
    const classNames =  Object.keys(res[0].definitions);
    expect(classNames).to.have.length(5);
    expect(classNames.map(x => res[0].definitions[x]).map(x => x.storage)).to.contain.members(['default']);
    expect(classNames.map(x => res[0].definitions[x]).map(x => x.title)).to.contain.members(['Driver', 'Car', 'RandomData']);
    const driver = res[0].definitions.Driver;
    const propertyNames =  Object.keys(driver.properties);
    expect(propertyNames).to.have.length(4);
    expect(propertyNames).to.be.deep.eq(['id', 'firstName', 'lastName', 'car']);
  }

  @test
  async 'list entity'() {
    const url = server.url();
    let res: any = await http.get(url + '/api' +
      API_CTRL_STORAGE_METADATA_GET_ENTITY.replace(':name', 'driver'), { responseType: 'json' });
    expect(res).to.not.be.null;
    res = res.body as IJsonSchema7;
    expect(res).to.exist;
    expect(res.definitions.Driver.storage).to.be.eq('default');
    expect(res.definitions.Driver.title).to.be.eq('Driver');
    const propertyNames =  Object.keys(res.definitions.Driver.properties);
    expect(propertyNames).to.have.length(4);
    expect(propertyNames).to.be.deep.eq(['id', 'firstName', 'lastName', 'car']);
  }

  @test.skip
  async 'create entity class'() {

  }


  @test.skip
  async 'add entity property'() {

  }

  @test.skip
  async 'modify entity property'() {

  }

  @test.skip
  async 'remove entity property'() {

  }

  @test
  async 'create single plain entity'() {
    // save one driver
    const d = new RandomData();
    d.numValue = 1234;
    d.short = 'hallo';
    d.long = 'welt '.repeat(50);
    d.date = new Date();
    d.bool = true;
    d.boolNeg = false;
    d.floatValue = 0.34;

    // save one driver
    let res: any = await http.post(URL + '/api' +

      API_CTRL_STORAGE_SAVE_ENTITY.replace(':name', snakeCase(RandomData.name)),
    {
      json: d,
      responseType: 'json'
    }
    );

    expect(res).to.not.be.null;
    res = res.body;

    expect(res.id).to.be.gt(0);
    // correct string date
    res.date = new Date(res.date);
    expect(res).to.be.deep.include(d);
    expect(res.$state).to.be.deep.include({ isValidated: true, isSuccessValidated: true });

    const found = await defaultStorageRef.getController().findOne(RandomData, { id: res.id });
    expect(found).to.be.deep.include(d);

  }


  @test
  async 'create multiple plain entity'() {
    // save one driver
    const d1 = new RandomData();
    d1.numValue = 1234;
    d1.short = 'hallo';
    d1.long = 'welt '.repeat(50);
    d1.date = new Date();
    d1.bool = true;
    d1.boolNeg = false;
    d1.floatValue = 0.34;

    // save one driver
    const d2 = new RandomData();
    d2.numValue = 45634;
    d2.short = 'ballo';
    d2.long = 'ding '.repeat(12);
    d2.date = new Date();
    d2.bool = false;
    d2.boolNeg = true;
    d2.floatValue = 0.48;

    // save multiple driver
    let res: any = await http.post(URL + '/api' +

      API_CTRL_STORAGE_SAVE_ENTITY.replace(':name', snakeCase(RandomData.name)),
    {
      json: [d1, d2],
      responseType: 'json'
    }
    );

    expect(res).to.not.be.null;
    res = res.body;

    expect(res).to.have.length(2);
    // correct string date
    res.map((x: any) => x.date = new Date(x.date));
    expect(res[0]).to.be.deep.include(d1);
    expect(res[1]).to.be.deep.include(d2);
    expect(res[0].$state).to.be.deep.include({ isValidated: true, isSuccessValidated: true });
    expect(res[1].$state).to.be.deep.include({ isValidated: true, isSuccessValidated: true });

    const found = await defaultStorageRef.getController().find(RandomData,
      { id: { $in: res.map((x: any) => x.id) } });
    expect(found).to.have.length(2);
    expect(found[0]).to.be.deep.include(d1);
    expect(found[1]).to.be.deep.include(d2);

  }

  @test
  async 'get single entity (by numeric id)'() {
    let res = await http.get(URL + '/api' +

      API_CTRL_STORAGE_GET_ENTITY.replace(':name', RandomData.name).replace(':id', '1'), { responseType: 'json' }
    );

    expect(res).to.not.be.null;
    res = res.body;

    expect(res).to.deep.eq({
      '$label': '1',
      '$url': '/storage/entity/random_data/1',
      [__CLASS__]: 'RandomData',
      [__REGISTRY__]: 'typeorm',
      'bool': false,
      'boolNeg': false,
      'date': '2020-02-01T23:00:00.000Z',
      'floatValue': 0.893,
      'id': 1,
      'long': 'long long long very long long long long very long long ' +
        'long long very long long long long very long long long long very long ',
      'numValue': 100,
      'short': 'short name 1'
    });
    expect(res).to.have.include.keys(['$url', '$label']);
  }


  @test
  async 'get multiple entities (by numeric id)'() {
    let res: any = await http.get(URL + '/api' +

      API_CTRL_STORAGE_GET_ENTITY
        .replace(':name', RandomData.name)
        .replace(':id', '1,2'), { responseType: 'json' }
    );

    expect(res).to.not.be.null;
    res = res.body as any;
    expect(res.$count).to.be.eq(2);
    expect(res.entities).to.have.length(2);
    // expect(res).to.have.length(2);
    expect(res.entities[0]).to.deep.eq({
      '$label': '1',
      '$url': '/storage/entity/random_data/1',
      [__CLASS__]: 'RandomData',
      [__REGISTRY__]: 'typeorm',
      'bool': false,
      'boolNeg': false,
      'date': '2020-02-01T23:00:00.000Z',
      'floatValue': 0.893,
      'id': 1,
      'long': 'long long long very long long long long very long long ' +
        'long long very long long long long very long long long long very long ',
      'numValue': 100,
      'short': 'short name 1'
    });
    expect(res.entities[1]).to.deep.eq({
      '$label': '2',
      '$url': '/storage/entity/random_data/2',
      [__CLASS__]: 'RandomData',
      [__REGISTRY__]: 'typeorm',
      'bool': true,
      'boolNeg': false,
      'date': '2020-03-03T23:00:00.000Z',
      'floatValue': 1.786,
      'id': 2,
      'long': 'long long long very long long long long very long long long long ' +
        'very long long long long very long long long long very long long long long ' +
        'very long long long long very long long long long very long long long long very long long long long very long ',
      'numValue': 200,
      'short': 'short name 2'
    });

  }

  @test.skip
  async 'get multiple entities (by string id)'() {

  }


  @test
  async 'find entities'() {
    let res = await http.get(URL + '/api' +

      API_CTRL_STORAGE_FIND_ENTITY.replace(':name', RandomData.name) + '?query=' +
      JSON.stringify({ short: 'short name 5' }), { responseType: 'json' }
    ) as any;

    expect(res).to.not.be.null;
    res = res.body;
    expect(res.$count).to.be.eq(1);
    expect(res.entities).to.have.length(1);
    expect(res.entities[0]).to.be.deep.eq({
      '$label': '5',
      '$url': '/storage/entity/random_data/5',
      [__CLASS__]: 'RandomData',
      [__REGISTRY__]: 'typeorm',
      'bool': false,
      'boolNeg': false,
      'date': '2020-06-09T22:00:00.000Z',
      'floatValue': 4.465,
      'id': 5,
      'long': 'long long long very long long long long very long long long long ' +
        'very long long long long very long long long long very long long long long ' +
        'very long long long long very long long long long very long long long long ' +
        'very long long long long very long long long long very long long long long ' +
        'very long long long long very long long long long very long long long long ' +
        'very long long long long very long long long long very long long long long ' +
        'very long long long long very long long long long very long long long long ' +
        'very long long long long very long long long long very long long long long ' +
        'very long long long long very long ',
      'numValue': 500,
      'short': 'short name 5'
    });

  }


  @test
  async 'find entities (by date)'() {
    const date = new Date('2020-06-09T22:00:00.000Z');
    let res = await http.get(URL + '/api' +

      API_CTRL_STORAGE_FIND_ENTITY.replace(':name', RandomData.name) + '?query=' +
      JSON.stringify({ date: { $gt: date } }), { responseType: 'json' }
    ) as any;

    expect(res).to.not.be.null;
    res = res.body;
    expect(res.$count).to.be.eq(5);
    expect(res.entities).to.have.length(5);
    expect(res.entities[0]).to.be.deep.eq({
      '$label': '6',
      '$url': '/storage/entity/random_data/6',
      [__CLASS__]: 'RandomData',
      [__REGISTRY__]: 'typeorm',

      'bool': true,
      'boolNeg': false,
      'date': '2020-07-11T22:00:00.000Z',
      'floatValue': 5.3580000000000005,
      'id': 6,
      'long': 'long long long very long long long long very long long long long ' +
        'very long long long long very long long long long very long long long long ' +
        'very long long long long very long long long long very long long long long ' +
        'very long long long long very long long long long very long long long long ' +
        'very long long long long very long long long long very long long long long ' +
        'very long long long long very long long long long very long long long long ' +
        'very long long long long very long long long long very long long long long ' +
        'very long long long long very long long long long very long long long long ' +
        'very long long long long very long long long long very long long long long ' +
        'very long long long long very long long long long very long long long long ' +
        'very long ',
      'numValue': 600,
      'short': 'short name 6'
    });
    expect(res.entities.map((x: any) => new Date(x.date) > date)).not.contain(false);

  }


  @test
  async 'find entities restricted by permissions'() {
    permissionsCheck = true;
    let res;
    try {
      res = await http.get(URL + '/api' +
        API_CTRL_STORAGE_FIND_ENTITY.replace(':name', SecuredObject.name) + '?limit=5',
      { responseType: 'json', passBody: true, retry: 1 }
      ) as any;
      expect(true).to.be.false;
    } catch (err) {
      expect(err).to.not.be.null;
    }
    res = await http.get(URL + '/api' +
      API_CTRL_STORAGE_FIND_ENTITY.replace(':name', RandomData.name) + '?limit=5',
    { responseType: 'json', passBody: true, retry: 1 }
    ) as any;
    expect(res).to.not.be.null;
    expect(res.entities).to.have.length(5);

    permissionsCheck = false;
  }


  @test
  async 'aggregate entities'() {
    let res = await http.get(URL + '/api' +

      API_CTRL_STORAGE_AGGREGATE_ENTITY.replace(':name', RandomData.name) + '?aggr=' +
      JSON.stringify([
        { $match: { floatValue: { $gt: 2 } } },
        { $group: { _id: '$bool', sum: { $sum: '$floatValue' } } }
      ]), { responseType: 'json' }
    ) as any;

    expect(res).to.not.be.null;
    res = res.body;
    expect(res.$count).to.be.eq(2);
    expect(res.entities).to.have.length(2);
    expect(res.entities[0]).to.be.deep.eq({
      'bool': 0,
      'sum': 21.432000000000002
    });
    expect(res.entities[1]).to.be.deep.eq({
      'bool': 1,
      'sum': 25.004
    });
  }


  @test
  async 'update entity by id'() {
    const d2 = new RandomData();
    d2.numValue = 56341;
    d2.short = 'ballo welt';
    d2.long = 'ding '.repeat(5);
    d2.date = new Date();
    d2.bool = false;
    d2.boolNeg = true;
    d2.floatValue = 0.68;
    const dataSaved = (await defaultStorageRef.getController().save(d2)) as any;

    dataSaved.long = 'this is an update';
    let res = await http.post(URL + '/api' +

      API_CTRL_STORAGE_UPDATE_ENTITY
        .replace(':name', RandomData.name)
        .replace(':id', dataSaved.id), { json: dataSaved, responseType: 'json' }
    ) as any;

    expect(res).to.not.be.null;
    res = res.body;
    expect(res).to.be.deep.include({
      '$state': {
        'isSuccessValidated': true,
        'isValidated': true
      },
      'bool': false,
      'boolNeg': true,
      'date': d2.date.toISOString(),
      'floatValue': 0.68,
      'long': 'this is an update',
      'numValue': 56341,
      'short': 'ballo welt'
    });

  }

  @test
  async 'update entity by condition'() {
    const d = new Date();
    const entries = [];
    for (let i = 101; i < 111; i++) {
      const randomData = new RandomData();
      randomData.id = i;
      randomData.numValue = i * 100;
      randomData.floatValue = i * 0.893;
      randomData.bool = i % 2 === 0;
      randomData.date = new Date(2020, i, i * 2, 0, 0, 0);
      randomData.short = 'short name ' + i;
      randomData.long = 'test update';
      entries.push(randomData);
    }
    const saved = await defaultStorageRef.getController().save(entries);
    expect(saved).to.have.length(10);

    // save multiple driver
    let res: any = await http.put(URL + '/api' +

      API_CTRL_STORAGE_UPDATE_ENTITIES_BY_CONDITION.replace(':name', snakeCase(RandomData.name)) +
      '?query=' + JSON.stringify({ $and: [{ id: { $gte: 100 } }, { id: { $lte: 110 } }] }),
      <any>{
        json: {
          $set: {
            numValue: 123,
            long: 'this is an update'
          }
        },
        responseType: 'json'
      }
    );
    expect(res).to.not.be.null;
    res = res.body;

    // sqlite does not support node
    expect(res).to.be.eq(-2);

    const afterUpdate = await defaultStorageRef.getController().find(RandomData, { $and: [{ id: { $gte: 100 } }, { id: { $lte: 110 } }] });
    expect(afterUpdate).to.have.length(10);
    for (const entry of afterUpdate) {
      expect(entry).to.deep.include({
        numValue: 123,
        long: 'this is an update'
      });
    }

    const notUpdated = await defaultStorageRef.getController()
      .find(RandomData, { id: { $lte: 10 } });
    expect(notUpdated).to.have.length(10);
    for (const entry of notUpdated) {
      expect(entry).to.not.deep.include({
        numValue: 123,
        long: 'this is an update'
      });
    }
  }

  @test
  async 'delete entity by id'() {
    const d = new Date();
    const entries = [];
    for (let i = 101; i < 111; i++) {
      const randomData = new RandomData();
      randomData.id = i;
      randomData.numValue = i * 100;
      randomData.floatValue = i * 0.893;
      randomData.bool = i % 2 === 0;
      randomData.date = new Date(2020, i, i * 2, 0, 0, 0);
      randomData.short = 'short name ' + i;
      randomData.long = 'test delete';
      entries.push(randomData);
    }
    const saved = await defaultStorageRef.getController().save(entries);
    expect(saved).to.have.length(10);

    // delete by one id
    let res = await http.delete(URL + '/api' +

      API_CTRL_STORAGE_DELETE_ENTITY.replace(':name', RandomData.name)
        .replace(':id', '101'), { responseType: 'json' }
    );
    expect(res).to.not.be.null;
    res = res.body;
    let found = await defaultStorageRef.getController().find(RandomData, { id: 101 });
    expect(found).to.have.length(0);

    // delete by multiple id
    res = await http.delete(URL + '/api' +

      API_CTRL_STORAGE_DELETE_ENTITY.replace(':name', RandomData.name)
        .replace(':id', '102,103,104'), { responseType: 'json' }
    );
    expect(res).to.not.be.null;
    res = res.body;
    found = await defaultStorageRef.getController().find(RandomData,
      { id: { $in: [102, 103, 104] } });
    expect(found).to.have.length(0);

  }

  @test
  async 'delete entity by condition'() {
    const d = new Date();
    const entries = [];
    for (let i = 101; i < 111; i++) {
      const randomData = new RandomData();
      randomData.id = i;
      randomData.numValue = i * 100;
      randomData.floatValue = i * 0.893;
      randomData.bool = i % 2 === 0;
      randomData.date = new Date(2020, i, i * 2, 0, 0, 0);
      randomData.short = 'short name ' + i;
      randomData.long = 'test delete';
      entries.push(randomData);
    }
    const saved = await defaultStorageRef.getController().save(entries);
    expect(saved).to.have.length(10);

    // delete by one id
    let res = await http.delete(URL + '/api' +

      API_CTRL_STORAGE_DELETE_ENTITIES_BY_CONDITION.replace(':name', RandomData.name) +
      '?query=' + JSON.stringify({ $and: [{ long: 'test delete' }, { id: { $gte: 105 } }] }),
    { responseType: 'json' }
    );
    expect(res).to.not.be.null;
    res = res.body;
    expect(res).to.be.eq(-2);

    const afterDelete = await defaultStorageRef.getController().find(RandomData,
      { $and: [{ id: { $gte: 100 } }, { id: { $lte: 110 } }] });
    expect(afterDelete).to.have.length(4);

    const notDeleted = await defaultStorageRef.getController().find(RandomData, { id: { $lte: 10 } });
    expect(notDeleted).to.have.length(10);

  }


}
