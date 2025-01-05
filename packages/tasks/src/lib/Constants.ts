export const C_TASKS = 'tasks';
export const XS_TYPE_BINDING_SUBELEM = 'entity_ref_has_subelement';
export const XS_TYPE_BINDING_TASK_GROUP = 'task_group_binding';
export const XS_TYPE_BINDING_TASK_DEPENDS_ON = 'task_dependency_binding';

export const TN_TASKS_CLEANUP = 'tasks_cleanup';

/**
 * Classname of TaskQueueWorker
 */
export const CL_TASK_QUEUE_WORKER = 'TaskQueueWorker';
/**
 * Classname of TaskRunnerRegistry
 */
export const CL_TASK_RUNNER_REGISTRY = 'TaskRunnerRegistry';


export const TASKRUN_STATE_NEXT = 'next';
export const TASKRUN_STATE_RUN = 'run';
export const TASKRUN_STATE_DONE = 'done';
export const TASKRUN_STATE_FINISHED = 'finished';
export const TASKRUN_STATE_FINISH_PROMISE = 'finish_promise';
export const TASKRUN_STATE_UPDATE = 'update';

export const TASK_STATE_STOPPED = 'stopped';
export const TASK_STATE_STARTED = 'started';
export const TASK_STATE_RUNNING = 'running';
export const TASK_STATE_ERRORED = 'errored';
export const TASK_STATE_ENQUEUE = 'enqueue';
export const TASK_STATE_PROPOSED = 'proposed';
export const TASK_STATE_REQUEST_ERROR = 'request_error';

export const K_CLS_TASKS: string = 'tasks';
export const K_CLS_TASK_DESCRIPTORS = 'task_descriptors';


export type TASK_STATES = 'enqueue' | 'proposed' | 'started' | 'stopped' | 'running' | 'errored' | 'request_error';
export type TASK_RUNNER_SPEC = string | { name: string; incomings?: any };
export type TASK_PROPERTY_TYPE = 'runtime' | 'incoming' | 'outgoing';


export const K_TASK_TYPE = 'taskType';
export const K_TASK_NAME = 'taskName';

export const K_TASK_PERMISSIONS = 'permissions';
export const K_TASK_GROUPS = 'groups';
export const K_TASK_NODE_INFOS = 'nodeInfos';
export const K_TASK_DESCRIPTION = 'description';
export const K_TASK_REMOTE = 'remote';
export const C_NAMESPACE = 'namespace';
export const C_NAME = 'name';


/**
 * Use title for storing class name in json schema
 */
export const K_TASK_CLASS_NAME = 'title';
export const K_EXCHANGE_REF_TYPE = 'propertyType';

export enum TaskRefType {
  CALLBACK,
  CLASS,
  INSTANCE,
  GROUP,
  REMOTE
}


/**
 * TasksController constants
 */
export const _API_CTRL_TASKS = '/tasks';

// export const _API_CTRL_TASKS_LIST = '/list';
// export const API_CTRL_TASKS_LIST = _API_CTRL_TASKS + _API_CTRL_TASKS_LIST;
// export const PERMISSION_ALLOW_TASKS_LIST = 'tasks list view';

export const _API_CTRL_TASKS_METADATA = '/metadata';
export const API_CTRL_TASKS_METADATA = _API_CTRL_TASKS + _API_CTRL_TASKS_METADATA;
export const PERMISSION_ALLOW_TASKS_METADATA = 'task metadata view';

export const _API_CTRL_TASK_GET_METADATA = '/metadata/:taskName';
export const _API_CTRL_TASK_GET_METADATA_VALUE = '/metadata/:taskName/provider/:incomingName';
export const API_CTRL_TASK_GET_METADATA = _API_CTRL_TASKS + _API_CTRL_TASK_GET_METADATA;
export const API_CTRL_TASK_GET_METADATA_VALUE = _API_CTRL_TASKS + _API_CTRL_TASK_GET_METADATA_VALUE;
export const PERMISSION_ALLOW_TASK_GET_METADATA = PERMISSION_ALLOW_TASKS_METADATA;
export const PERMISSION_ALLOW_TASK_GET_METADATA_PATTERN = 'task :taskName metadata view';

export const _API_CTRL_TASK_EXEC = '/exec/:taskName';
export const API_CTRL_TASK_EXEC = _API_CTRL_TASKS + _API_CTRL_TASK_EXEC;
export const PERMISSION_ALLOW_TASK_EXEC = 'task execute';
export const PERMISSION_ALLOW_TASK_EXEC_PATTERN = 'task :taskName execute';

export const _API_CTRL_TASK_LOG = '/log/:nodeId/:runnerId';
export const API_CTRL_TASK_LOG = _API_CTRL_TASKS + _API_CTRL_TASK_LOG;
export const PERMISSION_ALLOW_TASK_LOG = 'task log view';

export const _API_CTRL_TASK_STATUS = '/status/:runnerId';
export const API_CTRL_TASK_STATUS = _API_CTRL_TASKS + _API_CTRL_TASK_STATUS;
export const PERMISSION_ALLOW_TASK_STATUS = 'task status view';

export const _API_CTRL_TASK_RUNNING = '/running/:nodeId';
export const API_CTRL_TASK_RUNNING = _API_CTRL_TASKS + _API_CTRL_TASK_RUNNING;
export const PERMISSION_ALLOW_TASK_RUNNING = 'task running view';

export const _API_CTRL_TASKS_RUNNING = '/running';
export const API_CTRL_TASKS_RUNNING = _API_CTRL_TASKS + _API_CTRL_TASKS_RUNNING;

export const PERMISSION_ALLOW_TASK_RUNNER_INFO_VIEW = 'task runners view';
export const _API_CTRL_TASKS_RUNNERS_INFO = '/runners';
export const API_CTRL_TASKS_RUNNERS_INFO = _API_CTRL_TASKS + _API_CTRL_TASKS_RUNNERS_INFO;

export const _API_CTRL_TASKS_RUNNING_ON_NODE = '/running_tasks/:nodeId';
export const API_CTRL_TASKS_RUNNING_ON_NODE = _API_CTRL_TASKS + _API_CTRL_TASKS_RUNNING_ON_NODE;
export const PERMISSION_ALLOW_TASKS_RUNNING = 'task running_tasks view';


export const LOG_EVENT_NAME = 'log_event';
