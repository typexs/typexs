import { ISystemApi } from '../api/ISystemApi';
import { UseAPI } from '../decorators/UseAPI';
import { SystemApi } from '../api/System.api';
import { INodeInfo } from '../libs/system/INodeInfo';
import { Inject } from 'typedi';
import { C_TASKS } from '../libs/tasks/Constants';
import { ITaskInfo } from '../libs/tasks/ITaskInfo';
import { SystemNodeInfo } from '../entities/SystemNodeInfo';
import { Tasks } from '../libs/tasks/Tasks';
import { TaskRunnerRegistry } from '../libs/tasks/TaskRunnerRegistry';
import { TaskQueueWorker } from '../workers/TaskQueueWorker';
import { IWorkerInfo } from '../libs/worker/IWorkerInfo';
import { C_WORKERS } from '../libs/worker/Constants';
import { TaskRef } from '../libs/tasks/TaskRef';
import { has, keys } from 'lodash';

@UseAPI(SystemApi)
export class TasksSystemExtension implements ISystemApi {

  @Inject(Tasks.NAME)
  tasks: Tasks;


  @Inject(TaskRunnerRegistry.NAME)
  tasksRunnerRegistry: TaskRunnerRegistry;

  async getNodeInfos(): Promise<INodeInfo | INodeInfo[]> {
    const infos = await this.tasks.toJsonSchema();
    const nodeTaskContext: INodeInfo = { context: C_TASKS };
    nodeTaskContext.tasks = infos;
    return nodeTaskContext;
  }


  async onNodeRegister(x: SystemNodeInfo) {
    if (x && has(x, 'contexts') && has(x, 'nodeId')) {
      const found = x.contexts.find(x => x.context === C_TASKS);
      if (found) {
        const workers = x.contexts.find(x => x.context === C_WORKERS);
        const hasWorker = !!workers[C_WORKERS].find((x: IWorkerInfo) => x.className === TaskQueueWorker.NAME);

        const nodeTasks = new Tasks('tasks-sysreg-' + x.nodeId);
        await nodeTasks.fromJsonSchema(found.tasks);
        nodeTasks.getTasks(true).map((info: TaskRef) => {
          if (this.tasks.contains(info.name)) {
            this.tasks.get(info.name).addNodeId(x.nodeId, hasWorker);
          } else {
            if (!info.isRemote()) {
              this.tasks.addRemoteTask(x.nodeId, info, hasWorker);
            }
          }
        });
        nodeTasks.clear();
      }
    }

    this.tasksRunnerRegistry.onNodeUpdate(x);
  }


  onNodeUnregister(x: SystemNodeInfo) {
    if (x && has(x, 'contexts') && has(x, 'nodeId')) {
      const found = x.contexts.find(x => x.context === C_TASKS);
      if (found) {
        const names =  Object.keys(found[C_TASKS].definitions);
        names.forEach(name => {
          if (this.tasks.contains(name)) {
            const task = this.tasks.get(name);
            task.removeNodeId(x.nodeId);
            if (!task.hasNodeIds()) {
              this.tasks.removeTask(task);
            }
          }
        });
      }
    }

    this.tasksRunnerRegistry.onNodeUpdate(x);
  }

}
