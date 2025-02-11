import { Inject } from 'typedi';
import { UseAPI } from '@typexs/base';
import { TasksApi } from '../api/Tasks.api';
import { ITasksApi } from '../api/ITasksApi';
import { TaskRunner } from '../lib/TaskRunner';
import { TaskRun } from '../lib/TaskRun';
import { TasksStorageHelper } from '../lib/helper/TasksStorageHelper';
import { C_STORAGE_DEFAULT } from '@typexs/base';
import { Cache } from '@typexs/base';
import { StorageRef } from '@typexs/base';


@UseAPI(TasksApi)
export class TasksStorageExtension implements ITasksApi {

  @Inject(Cache.NAME)
  cache: Cache;


  @Inject(C_STORAGE_DEFAULT)
  storageRef: StorageRef;


  onBefore(runner: TaskRunner) {
    this._onTaskRun(runner);
  }

  onStart(run: TaskRun) {
    this._onTaskRun(run);
  }

  onProgress(run: TaskRun) {
    this._onTaskRun(run);
  }

  onStop(run: TaskRun) {
    this._onTaskRun(run);
  }


  onAfter(runner: TaskRunner) {
    this._onTaskRun(runner);
  }

  onError(runner: TaskRun | TaskRunner) {
    this._onTaskRun(runner);
  }


  _onTaskRun(runner: TaskRun | TaskRunner) {
    if (this.storageRef) {
      let _runner: TaskRunner;
      if (runner instanceof TaskRun) {
        _runner = runner.getRunner();
      } else {
        _runner = runner;
      }

      const results = _runner.collectStats();
      // TasksStorageHelper.saveEnvelopedInTimeout(results, this.storageRef);
      TasksStorageHelper.save(results, this.storageRef).catch((e: any) => {
        console.log('');
      });
    }
    // return null;
  }

}
