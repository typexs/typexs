import {IReaderOptions} from './IReaderOptions';
import {IFindOptions} from '@typexs/base';
import {ClassType} from '@allgemein/schema-api';

export interface IStorageControllerReaderOptions<T> extends IReaderOptions, IFindOptions {

  storageName?: string;

  entityType: ClassType<T>;

  conditions?: any;

  maxLimit?: number;

}
