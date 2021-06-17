import {Component, OnDestroy, OnInit} from '@angular/core';
import {TaskRef, Tasks} from '@typexs/base';
import {BackendTasksService} from '../backend-tasks.service';
import {SystemInfoService} from '@typexs/base-ng';
import {Log} from '@typexs/base-ng';
import {Subscription} from 'rxjs';


@Component({
  selector: 'txs-tasks-metadata',
  templateUrl: './tasks-metadata.component.html'
})
export class TasksMetadataComponent implements OnInit, OnDestroy {

  private _tasks: Tasks;

  tasks: TaskRef[];

  sub: Subscription;

  constructor(private tasksService: BackendTasksService, private infoService: SystemInfoService) {
  }

  baseUrl() {
    return this.tasksService.getNgUrlPrefix();
  }

  hasWorkerNodes() {
    return this.tasksService.hasWorkerNodes();
  }

  getWorkerNodes() {
    return this.tasksService.getWorkerNodes();
  }

  ngOnInit() {
    this.sub = this.tasksService.getTaskList(true).subscribe(x => {
      this._tasks = x;
      this.tasks = [];
      x.names(true).forEach(y => {
        const ref = x.get(y);
        this.tasks.push(ref);
      });
    }, error => Log.error(error));
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

}
