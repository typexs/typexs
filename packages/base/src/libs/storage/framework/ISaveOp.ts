import { ISaveOptions } from './ISaveOptions';
import { IOp } from './IOp';

export interface ISaveOp<T> extends IOp<ISaveOptions> {

  getObjects(): T[];

  getIsArray(): boolean;

  run(object: T | T[], options?: ISaveOptions): Promise<T | T[]>;

}
