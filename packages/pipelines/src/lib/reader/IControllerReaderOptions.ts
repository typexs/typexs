import {IReaderOptions} from './IReaderOptions';
import {IFindOptions} from '@typexs/base';
import {ClassType} from '@allgemein/schema-api';

export interface IControllerReaderOptions<T> extends IReaderOptions, IFindOptions {

  entityType: ClassType<T>;

  conditions?: any;

  maxLimit?: number;

}
