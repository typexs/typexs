import {AbstractEvent} from '@typexs/base';
import {ITaskRunnerResult} from '../../../lib/ITaskRunnerResult';
import {TASK_OP} from './Constants';
import {TaskLog} from '../../../entities/TaskLog';
import {ITaskRunnerStatus} from '../../../lib/ITaskRunnerStatus';

export class TasksResponse extends AbstractEvent {

  op: TASK_OP;

  logFilePath: string;

  logFileContent: string;

  stats: ITaskRunnerResult[];

  taskLog: TaskLog;

  runningStatuses: ITaskRunnerStatus[];

}
