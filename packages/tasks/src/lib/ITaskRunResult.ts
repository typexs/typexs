// TODO make this better a generic
import {IError} from '@typexs/base';

export interface ITaskRunResult {

  tasksId: string;

  nr: number;

  name: string;

  created: Date;

  start: Date;

  stop: Date;

  duration: number;

  progress?: number;

  total?: number;

  incoming?: any;

  outgoing?: any;

  result: any;

  error: Error | IError;

  has_error: boolean;

}
