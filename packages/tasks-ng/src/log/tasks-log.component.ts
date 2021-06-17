import {
  defaults, find, isArray, isEmpty, isFunction, isNumber, intersection,
  get, clone, upperFirst, isNull, keys, values, isString, filter, merge, isPlainObject,
  concat, kebabCase, has, snakeCase, isRegExp, orderBy, remove, first, set, assign,
  capitalize, isUndefined
} from 'lodash';
import {Component, OnInit} from '@angular/core';
import {TaskRef} from '@typexs/base';
import {BackendTasksService} from '../backend-tasks.service';
import {SystemInfoService} from '@typexs/base-ng';
import {StorageService} from '@typexs/storage-ng';
import {TaskLog} from '@typexs/base/entities/TaskLog';
import {IDTGridOptions} from '@typexs/base-ng';
import {IGridColumn} from '@typexs/base-ng';
import {C_URL_HANDLER, C_URL_TITLE, CC_GRID_CELL_ROUTER_LINK} from '@typexs/base-ng';

/**
 * Show tasks list which should be filtered for running tasks, runned task
 *
 */
@Component({
  selector: 'txs-tasks-log',
  templateUrl: './tasks-log.component.html'
})
export class TasksLogComponent implements OnInit {

  tasks: TaskRef[];

  entries: TaskLog[] = [];

  ready = false;

  options: IDTGridOptions = {
    enablePager: true,
    limit: 25,
    pagerId: 'page',
    freeQueryBuilder: true,
    columnsPostProcess: this.columnsPostProcess.bind(this)
  };


  constructor(private tasksService: BackendTasksService,
              private infoService: SystemInfoService,
              private storageService: StorageService) {
  }


  columnsPostProcess(columns: IGridColumn[]) {
    const column = columns.find(x => x.field === 'tasksId');
    column.cellValueRenderer = CC_GRID_CELL_ROUTER_LINK;
    set((<any>column), C_URL_HANDLER, (v: any, row: any) => {
      return [this.tasksService.getNgUrlPrefix(), 'status', row.respId, row.tasksId];
    });
    set((<any>column), C_URL_TITLE, (v: any, row: any) => {
      return v;
    });
  }


  ngOnInit() {
    this.storageService.isReady((x: boolean) => x ? this.onInit() : null);
  }


  onInit() {
    this.storageService.query(TaskLog.name);
  }
}
