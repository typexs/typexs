import { IReaderOptions } from './IReaderOptions';
import { IFindOptions } from '@typexs/base';
import { ClassType } from '@allgemein/schema-api';

export interface IStorageControllerReaderOptions<T> extends IReaderOptions, IFindOptions {

  storageName?: string;

  mode?: 'find' | 'aggregate';

  entityType: ClassType<T>;

  maxLimit?: number;

}
