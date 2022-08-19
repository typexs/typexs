import { ITaskRefNodeInfo } from './ITaskRefNodeInfo';


/**
 * Base task information which should be in a tasks
 */
export interface ITaskInfo {

  name?: string;

  groups?: string[];

  permissions?: string[];

  description?: string;

  nodeInfos?: ITaskRefNodeInfo[];

  remote?: boolean;

}
