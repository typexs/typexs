import { IAggregateOptions } from './IAggregateOptions';
import { ClassType } from '@allgemein/schema-api';
import { IOp } from './IOp';

export interface IAggregateOp extends IOp<IAggregateOptions> {

  getEntityType(): Function | string | ClassType<any>;

  getPipeline(): any[];

  run(entryType: Function | string | ClassType<any>, pipeline: any[], options?: IAggregateOptions): Promise<any[]>;
}
