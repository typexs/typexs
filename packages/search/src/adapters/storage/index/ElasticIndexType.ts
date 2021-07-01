import {IIndexType} from '../../../lib/IIndexType';
import {ClassType} from '@allgemein/schema-api';
import {IStorageRef} from '@typexs/base';
import {ElasticStorageRef} from '../../../lib/elastic/ElasticStorageRef';

export class ElasticIndexType implements IIndexType {
  getType(): string {
    return 'elastic';
  }

  getStorageRefClass(): ClassType<IStorageRef> {
    return ElasticStorageRef;
  }
}
