import { ITaskRunnerResult } from '../ITaskRunnerResult';
import { ITaskRunResult } from '../ITaskRunResult';
import { StorageRef } from '@typexs/base';
import { TaskLog } from '../../entities/TaskLog';
import { concat, find, get, isArray, remove } from '@typexs/generic';
import { LockFactory, Semaphore } from '@allgemein/base';
import { TASK_STATE_RUNNING } from '../Constants';

export class TasksStorageHelper {


  static semaphores: { [k: string]: Semaphore } = {};

  static timeouts: { [k: string]: any } = {};

  static getLockFactory() {
    return LockFactory.$();
  }

  /**
   * Can get results from local and remote worker processes and should save the statuses
   *
   * @param result
   * @param storageRef
   */
  static async save(result: ITaskRunnerResult, storageRef: StorageRef) {
    let semaphore: Semaphore = null;
    if (!this.semaphores[result.id]) {
      this.semaphores[result.id] = this.getLockFactory().semaphore(1);
      semaphore = this.semaphores[result.id];
    } else {
      semaphore = this.semaphores[result.id];
    }
    await semaphore.acquire();
    await this.saveRunnerResults(result, storageRef);
    semaphore.release();

    if (!semaphore.isReserved()) {
      // cleanup
      setTimeout(() => {
        semaphore.purge();
        this.getLockFactory().remove(semaphore);
        delete this.semaphores[result.id];
      });
    }
  }


  /**
   * Can get results from local and remote worker processes and should save the statuses
   *
   * @param result
   * @param storageRef
   */
  static saveEnvelopedInTimeout(result: ITaskRunnerResult, storageRef: StorageRef) {
    if (this.timeouts[result.id]) {
      this.clearTimeout(result.id);
    }
    this.timeouts[result.id] = setTimeout(() => {
      this.save(result, storageRef)
        .catch(() => {
        })
        .finally(() => this.clearTimeout(result.id));
    }, 50);
  }


  static clearTimeout(id: string) {
    clearTimeout(this.timeouts[id]);
    delete this.timeouts[id];

  }

  static async saveRunnerResults(taskRunnerResults: ITaskRunnerResult,
    storageRef: StorageRef) {

    const controller = storageRef.getController();
    // get all log entries with this task runner id and for all workers/nodes
    const logs: TaskLog[] = await controller.find(TaskLog, { tasksId: taskRunnerResults.id });

    let toremove: TaskLog[] = [];
    const taskNames = isArray(taskRunnerResults.tasks) ? taskRunnerResults.tasks : [taskRunnerResults.tasks];
    const results = get(taskRunnerResults, 'results', null);
    for (const targetId of taskRunnerResults.targetIds) {
      for (const taskName of taskNames) {
        // foreach nodes where task is running check if taskName
        const existsAll = remove(logs, l => l.taskName === taskName && l.respId === targetId);
        let exists = existsAll.shift();
        if (existsAll.length > 0) {
          toremove = concat(toremove, existsAll);
        }
        if (!exists) {
          exists = new TaskLog();
          exists.tasksId = taskRunnerResults.id;
          exists.nodeId = taskRunnerResults.nodeId;
          exists.taskName = taskName;
          exists.respId = targetId;
          exists.callerId = taskRunnerResults.callerId;
        }
        logs.push(exists);
        exists.state = taskRunnerResults.state;

        if (results) {
          const result: ITaskRunResult = find(results, r => r.name === taskName);
          exists.taskNr = result.nr;
          exists.hasError = result.has_error;
          // exists.errors = JSON.stringify(result.error);
          exists.started = result.start;
          exists.stopped = result.stop;
          exists.created = result.created;
          exists.duration = result.duration;
          exists.progress = result.progress;
          exists.total = result.total;
          exists.done = get(result, 'done', false);
          exists.running = get(result, TASK_STATE_RUNNING, false);
          exists.weight = get(result, 'weight', -1);

          exists.data = <any>{
            results: result.result,
            incoming: result.incoming,
            outgoing: result.outgoing,
            error: result.error
          };
        }

        // if (exists.tasksId && exists.respId && cache) {
        //   const cacheKey = ['tasklog', exists.tasksId, targetId].join(':');
        //   cache.set(cacheKey, exists);
        // }
      }
      // TODO notify a push api if it exists
    }

    await controller.save(logs);

    if (toremove.length > 0) {
      await controller.remove(toremove);
    }

  }

  //
  // static await() {
  //   return new Promise(resolve => {
  //     this.emitter.once('done', resolve);
  //   });
  // }


}
