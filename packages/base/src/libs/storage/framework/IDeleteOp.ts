import { ClassType } from '@allgemein/schema-api';
import { IDeleteOptions } from './IDeleteOptions';
import { IOp } from './IOp';

export interface IDeleteOp<T> extends IOp<IDeleteOptions> {

  getRemovable(): T | T[] | ClassType<T>;

  getConditions(): any;

  run(object: T | T[] | ClassType<T>, conditions?: any): Promise<T | T[] | number>;

}
