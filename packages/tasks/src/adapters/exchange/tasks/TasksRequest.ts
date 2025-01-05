import { AbstractEvent, IFileSelectOptions } from '@typexs/base';
import { TASK_OP } from './Constants';

export class TasksRequest extends AbstractEvent {

  op: TASK_OP;

  runnerId: string;

  relative: boolean;

  fileOptions: IFileSelectOptions;

}
