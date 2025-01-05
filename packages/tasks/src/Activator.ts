import { defaults, isEmpty, uniq } from '@typexs/generic';
import { Config } from '@allgemein/config';
import { Bootstrap, IActivator, Injector } from '@typexs/base';
import {
  C_TASKS,
  PERMISSION_ALLOW_TASK_EXEC, PERMISSION_ALLOW_TASK_EXEC_PATTERN,
  PERMISSION_ALLOW_TASK_GET_METADATA, PERMISSION_ALLOW_TASK_LOG, PERMISSION_ALLOW_TASK_RUNNING, PERMISSION_ALLOW_TASK_STATUS,
  PERMISSION_ALLOW_TASKS_METADATA
} from '../../tasks/src/lib/Constants';
import { Tasks } from '../../tasks/src/lib/Tasks';
import { TaskRunnerRegistry } from '../../tasks/src/lib/TaskRunnerRegistry';
import { RegistryFactory } from '@allgemein/schema-api';
import { BasicPermission, IPermissionDef, IPermissions } from '@typexs/roles-api';

export class Activator implements IActivator, IPermissions {
  //
  // configSchema(): any {
  //   return CONFIG_SCHEMA;
  // }

  startup(): void {

    /**
     * Initialize task registry
     */
    RegistryFactory.register(new RegExp('^' + C_TASKS + '.*'), Tasks);
    const tasks = RegistryFactory.get(C_TASKS) as Tasks;
    let cfg = Config.get(C_TASKS, {});
    defaults(cfg, { nodeId: Bootstrap.getNodeId() });
    if (cfg) {
      tasks.setConfig(cfg);
    }
    Injector.set(Tasks.NAME, tasks);
    const taskRunnerRegistry = Injector.create(TaskRunnerRegistry);
    Injector.set(TaskRunnerRegistry.NAME, taskRunnerRegistry);

  }

  permissions(): IPermissionDef[] {

    let permissions: string[] = [

      /**
       * Tasks Permissions
       */
      PERMISSION_ALLOW_TASKS_METADATA,

      PERMISSION_ALLOW_TASK_GET_METADATA,
      PERMISSION_ALLOW_TASK_EXEC,
      PERMISSION_ALLOW_TASK_EXEC_PATTERN,

      PERMISSION_ALLOW_TASK_LOG,
      PERMISSION_ALLOW_TASK_STATUS,
      PERMISSION_ALLOW_TASK_RUNNING

    ];


    permissions = uniq(permissions.filter(x => !isEmpty(x)));
    permissions = uniq(permissions);

    // TODO how to solve dynamic task injection and concret permissions?

    return permissions.map(x => new BasicPermission(x));
  }


}
