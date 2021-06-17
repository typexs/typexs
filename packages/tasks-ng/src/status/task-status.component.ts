import {isArray} from 'lodash';
import {Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges} from '@angular/core';
import {BackendTasksService} from '../backend-tasks.service';
import {TaskLog} from '@typexs/base/entities/TaskLog';
import {Subscription} from 'rxjs';
import {Log} from '@typexs/base-ng';

/**
 * Show status of a task (running or finished)
 *
 * - show base task data
 * - show results, incomigs, outgoing
 * - show log if present as tail or scrollable content
 * - show error or running status
 *
 * Actions:
 * - abort running task!
 * - rerun with same configuration (incomming)
 */
@Component({
  selector: 'txs-task-status',
  templateUrl: './task-status.component.html',
  styleUrls: ['./task-status.component.scss']
})
export class TaskStatusComponent implements OnInit, OnDestroy, OnChanges {

  @Input()
  nodeId: string;

  @Input()
  runnerId: string;

  @Input()
  taskLog: TaskLog;

  @Output()
  status: EventEmitter<TaskLog> = new EventEmitter<TaskLog>();

  @Input()
  autoUpdate: boolean = true;

  running: boolean = false;

  subscription: Subscription;

  position = 0;

  fetchSize = 1;

  contentContainer = 'log';

  constructor(private tasksService: BackendTasksService) {
  }


  ngOnInit() {
    if (this.taskLog) {
      this.runnerId = this.taskLog.tasksId;
      this.nodeId = this.taskLog.respId;
    }
    this.update();
  }

  ngOnChanges(changes: SimpleChanges) {
    let reload = false;
    if (changes['runnerId']) {
      reload = true;
    }
    if (changes['nodeId']) {
      reload = true;
    }
    if (reload) {
      this.ngOnDestroy();
      this.update();
    }
  }


  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }


  update() {
    if (!this.running) {
      this.running = true;
      this.subscription = this.tasksService
        .taskStatus(this.runnerId, {targetIds: [this.nodeId]})
        .subscribe(tasks => {
            if (isArray(tasks)) {
              this.taskLog = tasks.shift();
            } else {
              this.taskLog = tasks;
            }

            if (this.taskLog) {
              this.status.emit(this.taskLog);
              if (!this.taskLog.running) {
                this.running = false;
              }
            } else {
              this.running = false;
            }
          },
          error => {
            Log.error(error);
            this.running = false;
          },
          () => {
            this.running = false;
          });
    }
  }


}
