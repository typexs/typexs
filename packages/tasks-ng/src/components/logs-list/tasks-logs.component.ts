import { set } from 'lodash';
import { Component, OnInit } from '@angular/core';
import { TaskRef } from '@typexs/base';
import { BackendTasksService } from '../../services/backend-tasks.service';
import { C_URL_HANDLER, C_URL_TITLE, CC_GRID_CELL_ROUTER_LINK, IDatatableOptions, IGridColumn, SystemInfoService } from '@typexs/base-ng';
import { StorageService } from '@typexs/storage-ng';
import { TaskLog } from '@typexs/base/entities/TaskLog';

/**
 * Show tasks list which should be filtered for running tasks, runned task
 *
 */
@Component({
  selector: 'txs-tasks-log',
  templateUrl: './tasks-logs.component.html'
})
export class TasksLogsComponent implements OnInit {

  tasks: TaskRef[];

  entries: TaskLog[] = [];

  ready = false;

  options: IDatatableOptions = {
    enablePager: true,
    limit: 25,
    pagerId: 'page',
    freeQueryBuilder: true,
    columnsPostProcess: this.columnsPostProcess.bind(this)
  };


  constructor(
    private tasksService: BackendTasksService,
    private infoService: SystemInfoService,
    private storageService: StorageService) {
  }


  columnsPostProcess(columns: IGridColumn[]) {
    const column = columns.find(x => x.field === 'tasksId');
    column.cellValueRenderer = CC_GRID_CELL_ROUTER_LINK;
    set((<any>column), C_URL_HANDLER,
      (v: any, row: any) => {
        return [this.tasksService.getNgUrlPrefix(), 'status', row.respId, row.tasksId];
      }
    );
    set((<any>column), C_URL_TITLE, (v: any, row: any) => v);
  }


  ngOnInit() {
    this.storageService.isLoaded().subscribe((x: boolean) => x ? this.onInit() : null);
  }


  onInit() {
    this.storageService.query(TaskLog.name);
  }
}
