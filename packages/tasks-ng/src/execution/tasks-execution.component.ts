import {
  defaults, find, isArray, isEmpty, isFunction, isNumber, intersection,
  get, clone, upperFirst, isNull, keys, values, isString, filter, merge, isPlainObject,
  concat, kebabCase, has, snakeCase, isRegExp, orderBy, remove, first, set, assign,
  capitalize, isUndefined
} from 'lodash';
import {Component, OnInit} from '@angular/core';
import {TaskExchangeRef, TaskRef} from '@typexs/base';
import {ActivatedRoute} from '@angular/router';
import {BackendTasksService} from '../backend-tasks.service';
import {TaskEvent} from '@typexs/base/libs/tasks/worker/TaskEvent';

/**
 * Executes a selected task
 */
@Component({
  selector: 'txs-tasks-execution',
  templateUrl: './tasks-execution.component.html'
})
export class TasksExecutionComponent implements OnInit {

  waiting = false;

  done = false;

  taskName: string;

  taskRef: TaskRef;

  error: Error;

  nodeIds: string[] = [];

  properties: TaskExchangeRef[] = [];

  parameters: any = {};

  events: TaskEvent[];

  _cachedValues: { [k: string]: any } = {};

  constructor(private tasksService: BackendTasksService,
              private route: ActivatedRoute) {
  }


  ngOnInit() {
    this.tasksService.getTaskList(true).subscribe(tasks => {
      this.taskName = this.route.snapshot.paramMap.get('taskName');
      this.taskRef = tasks.get(this.taskName);
      this.taskRef.getPropertyRefs().forEach(p => {
        if (p.getPropertyType() === 'incoming') {
          this.parameters[p.machineName] = p.getOptions('default', null);
          this.properties.push(<TaskExchangeRef>p);
          if (!this._cachedValues[p.name]) {
            const valueProvider = p.getOptions('valueProvider');
            if (valueProvider) {
              const optional = p.isOptional();
              if (isString(valueProvider)) {
                this.tasksService.getTaskIncomingValues(this.taskName, p.name).subscribe(value => {
                  this.setCachedValues(p.name, value, optional);
                });
              } else {
                this.setCachedValues(p.name, valueProvider, optional);
              }
            }
          }
        }
      });
    });
  }


  setCachedValues(name: string, values: any[], optional: boolean = false) {
    if (optional) {
      values.unshift(null);
    }
    this._cachedValues[name] = values;
  }


  isRequired(p: TaskExchangeRef) {
    return !p.isOptional();
  }


  isCollection(p: TaskExchangeRef) {
    const cardinality = p.getOptions('cardinality');
    return isNumber(cardinality) && (cardinality === 0 || cardinality > 1);
  }


  hasValueProvider(p: TaskExchangeRef) {
    const valueProvider = p.getOptions('valueProvider');
    const b = !!valueProvider;
    return b;
  }


  execute() {
    this.waiting = true;
    this.tasksService.execute(this.taskName, this.parameters, this.nodeIds).subscribe(
      events => {
        this.waiting = false;
        this.events = events;
        // if (event.errors && event.errors.length > 0) {
        //   return;
        // } else {
        //   this.done = true;
        //   // this.router.navigate([this.tasksService.getNgUrlPrefix(), 'status', event.id]);
        // }
      },
      error => {
        this.waiting = false;
        this.error = error;
      }
    );
  }

  reset() {
    this.events = null;
    this.done = false;
    this.waiting = false;
    this.parameters = {};
  }

}
