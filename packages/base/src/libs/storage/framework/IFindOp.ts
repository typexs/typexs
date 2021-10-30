import { IFindOptions } from './IFindOptions';
import { ClassType } from '@allgemein/schema-api';
import { IOp } from './IOp';

export interface IFindOp<T> extends IOp<IFindOptions> {

  getFindConditions(): any;

  getEntityType(): Function | string | ClassType<T>;

  run(entityType: Function | string, findConditions: any, options?: IFindOptions): Promise<T[]>;

}
