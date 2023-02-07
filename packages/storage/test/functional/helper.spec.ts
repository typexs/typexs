import { suite, test } from '@testdeck/mocha';
import { Bootstrap, Config, Injector, IStorageRefOptions, RuntimeLoader, ITypeOrmStorageRefOptions } from '@typexs/base';
import { expect } from 'chai';
import { ClassRef, IJsonSchema7 } from '@allgemein/schema-api';
import { TestHelper } from '@typexs/testing';
import { TEST_STORAGE_OPTIONS } from './config';
import { clone } from 'lodash';
import { StorageLoader } from '../../src/lib/StorageLoader';
import { SchemaApiSimpleEntity } from './data/dynamic-loading/entities/SchemaApiSimpleEntity';
import { JsonSchema } from '@angular-devkit/core/src/json/schema';
import { StorageSetting } from '../../src/entities/storage/StorageSetting';
import { TestStorageSettings } from '../../src/ops/TestStorageSettings';
import { ActivateStorageSetting } from '../../src/ops/ActivateStorageSetting';

@suite('functional/helper')
class HelperSpec {

  @test
  async 'resolve storage setting id of name'() {
    let resolve = StorageSetting.resolveId('x_1');
    expect(resolve).to.be.deep.eq({ name: 'x', id: 1 });
    resolve = StorageSetting.resolveId('xyz_1');
    expect(resolve).to.be.deep.eq({ name: 'xyz', id: 1 });
    resolve = StorageSetting.resolveId('xyz_1234');
    expect(resolve).to.be.deep.eq({ name: 'xyz', id: 1234 });
    resolve = StorageSetting.resolveId('xyz_123_1234');
    expect(resolve).to.be.deep.eq({ name: 'xyz_123', id: 1234 });
  }

  @test
  async 'fail resolve of storage setting id of name'() {
    expect(function() {
      StorageSetting.resolveId('x_');
    }).to.throw('id is not present in the name');
    expect(function() {
      StorageSetting.resolveId('_12');
    }).to.throw('id is not present in the name');
    expect(function() {
      StorageSetting.resolveId('');
    }).to.throw('value is empty');
    expect(function() {
      StorageSetting.resolveId(null);
    }).to.throw('value is empty');
    expect(function() {
      StorageSetting.resolveId(undefined);
    }).to.throw('value is empty');
    expect(function() {
      StorageSetting.resolveId(1 as any);
    }).to.throw('value is not a string');
  }

}
