import {
  defaults, find, isArray, isEmpty, isFunction, isNumber, intersection,
  get, clone, upperFirst, isNull, keys, values, isString, filter, merge, isPlainObject,
  concat, kebabCase, has, snakeCase, isRegExp, orderBy, remove, first, set, assign,
  capitalize, isUndefined
} from 'lodash';
import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {BackendTasksService} from '../backend-tasks.service';
import {TaskLog} from '@typexs/base/entities/TaskLog';
import {Subscription} from 'rxjs';
import {Log} from '@typexs/base-ng';

@Component({
  selector: 'txs-task-status-row',
  templateUrl: './task-status-row.component.html'
})
export class TaskStatusRowComponent implements OnInit, OnDestroy {

  @Input()
  runnerId: string;

  @Input()
  nodeId: string;

  taskLog: TaskLog;


  subscription: Subscription = new Subscription();


  constructor(private tasksService: BackendTasksService) {
  }

  baseUrl() {
    return this.tasksService.getNgUrlPrefix();
  }

  state() {
    if (this.taskLog) {
      if (this.taskLog.running) {
        return 'warning';
      } else {
        if (this.taskLog.hasError) {
          return 'error';
        }
        return 'success';
      }
    }
    return 'info';
  }

  ngOnInit() {
    this.update();
  }

  update() {
    Log.debug('update', this.runnerId, this.nodeId);
    this.subscription = this.tasksService.taskStatus(this.runnerId, {targetIds: [this.nodeId]}).subscribe(tasks => {
      if (tasks && !isEmpty(tasks)) {
        if (isArray(tasks)) {
          this.taskLog = tasks.shift();
        } else {
          this.taskLog = tasks;
        }

        if (this.taskLog &&
          this.taskLog.state &&
          ['stopped', 'errored', 'request_error'].indexOf(this.taskLog.state) === -1) {
          this.ngOnDestroy();
        }
      }
    });

  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

  }


}
