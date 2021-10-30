import { ClassType } from '@allgemein/schema-api';
import { IUpdateOptions } from './IUpdateOptions';
import { IOp } from './IOp';


export interface IUpdateOp<T> extends IOp<IUpdateOptions> {

  getConditions(): any;

  getUpdate(): any;

  getEntityType(): ClassType<T>;

  run(cls: ClassType<T>, condition: any, update: any, options?: IUpdateOptions): Promise<number>;

}
