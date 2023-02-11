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


}
