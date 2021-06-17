import {Component, Input} from '@angular/core';
import {TaskLog} from '@typexs/base/entities/TaskLog';
import {ActivatedRoute} from '@angular/router';
import {BackendTasksService} from '../backend-tasks.service';

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
  selector: 'txs-task-status-page',
  styleUrls: ['task-status-page.component.scss'],
  templateUrl: './task-status-page.component.html',
})
export class TaskStatusPageComponent {

  @Input()
  navigatorEnable: boolean = true;

  nodeId: string;

  runnerId: string;

  taskLog: TaskLog;

  taskLogs: { [k: string]: TaskLog } = {};


  constructor(private route: ActivatedRoute,
              private taskService: BackendTasksService) {
  }


  ngOnInit() {
    this.runnerId = this.route.snapshot.paramMap.get('runnerId');
    this.nodeId = this.route.snapshot.paramMap.get('nodeId');
  }

  lookupNeighbours() {
    if (this.taskLog) {
      this.taskLogs = {};
      this.taskService.query({$or: [{id: this.taskLog.id + 1}, {id: this.taskLog.id - 1}]}, {targetIds: [this.nodeId]})
        .subscribe(x => {
          if (x) {
            x.entities.map((y: TaskLog) => {
              if (y.id === this.taskLog.id - 1) {
                this.taskLogs['prev'] = y;
              } else if (y.id === this.taskLog.id + 1) {
                this.taskLogs['next'] = y;
              }
            });
          }
        });
    }


  }

  changeRunnerId(runnerId: string) {
    this.runnerId = runnerId;
  }

  updateTaskLog(taskLog: TaskLog) {
    this.taskLog = taskLog;
    if (this.navigatorEnable) {
      this.lookupNeighbours();
    }

  }


}
