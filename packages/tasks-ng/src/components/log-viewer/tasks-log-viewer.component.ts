import { first, has, isEmpty, isUndefined } from 'lodash';
import { Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { JsonUtils } from '@allgemein/base/utils/JsonUtils';
import { DatePipe } from '@angular/common';
import { interval, Observable, Subscriber, Subscription } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { Log } from '@typexs/base-ng';
import { BackendTasksService } from '../../services/backend-tasks.service';

/**
 * Show tasks list which should be filtered for running tasks, runned task
 *
 * TODO what should happened if task log entry is missing or log content is not found
 */
@Component({
  selector: 'txs-task-log-viewer',
  templateUrl: './tasks-log-viewer.component.html',
  styleUrls: ['./tasks-log-viewer.component.scss']
})
export class TasksLogViewerComponent implements OnInit, OnChanges, OnDestroy {

  @Input()
  nodeId: string;

  @Input()
  runnerId: string;

  @Input()
  running: boolean = true;

  @Input()
  offset: number = 1000;

  @Input()
  autoUpdate: boolean = false;

  @Input()
  allowSwitchMode: boolean = true;

  _mode: 'tail' | 'less' = 'tail';

  _tail: number = 50;

  get mode(): 'tail' | 'less' {
    return this._mode;
  }

  set mode(mode: 'tail' | 'less') {
    this._mode = mode;
    this.handle();
  }

  @ViewChild('logPanel', { static: false })
  elemRef: ElementRef;

  count: number = 0;

  position: number = 0;

  maxlines: number = 0;

  fetchedLines: number = 0;

  fetchSize = 100;

  update: boolean;

  log: string = '';

  logError: string;

  subscription: Subscription = null;

  updateSubscription: Subscription = null;


  constructor(
    private tasksService: BackendTasksService,
    private datePipe: DatePipe) {
  }


  ngOnInit() {
    // if (this.taskLog) {
    //   this.runnerId = this.taskLog.tasksId;
    //   this.nodeId = this.taskLog.respId;
    // }
    this.handle();

    if (this.autoUpdate) {
      this.enableAutoUpdate();
    }
  }

  enableAutoUpdate() {
    if (!this.updateSubscription && this.mode === 'tail') {
      this.updateSubscription = interval(this.offset).subscribe(x => {
        this.tail();
      });
    }
  }

  disableAutoUpdate() {
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
      this.updateSubscription = undefined;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['autoUpdate']) {
      if (changes['autoUpdate'].currentValue) {
        this.enableAutoUpdate();
      } else {
        this.disableAutoUpdate();
        this.handle();
      }
    }
    if (changes['running']) {
      if (!changes['running'].currentValue) {
        this.disableAutoUpdate();
        this.handle();
      }
    }
    let reload = false;
    if (changes['runnerId']) {
      reload = true;
    }
    if (changes['nodeId']) {
      reload = true;
    }

    if (reload) {
      this.ngOnDestroy();
      this.handle();
    }
  }


  reset() {
    this.position = 0;
    this.maxlines = 0;
    this.fetchedLines = 0;
    this.log = '';
    this.logError = '';
  }

  handle() {
    this.resetSub();
    switch (this._mode) {
      case 'tail':
        this.tail();
        break;
      case 'less':
        this.less();
        break;
    }
  }

  tail() {
    if (this.runnerId && this.nodeId) {
      this.subscription = this.tasksService
        .getTaskLog(this.runnerId, this.nodeId, null, null, this._tail)
        .subscribe(x => {
          if (x) {
            this.reset();
            const extractLines = this.extractLines(x);
            this.append(extractLines);
          }
        }, error => {
          this.logError = 'Log file not found. (' + error.message + ')';
          this.finishUpdate();
          this.resetSub();
        },
        () => {
          this.resetSub();
        });
    } else {
      this.resetSub();
    }
  }


  less() {
    this.reset();
    let _subscriber: Subscriber<any> = null;
    this.subscription = new Observable(subscriber => {
      _subscriber = subscriber;
      subscriber.next(1);
    })
      .pipe(
        mergeMap((x: number) => {
          const from = this.fetchedLines;
          return this.tasksService.getTaskLog(this.runnerId, this.nodeId, from, this.fetchSize);
        })
      )
      .subscribe(x => {
        const extractLines = this.extractLines(x);
        this.fetchedLines += extractLines.length;
        const appended = this.append(extractLines);
        if (appended > 0 || this.running) {
          _subscriber.next(1);
        } else {
          _subscriber.complete();
        }
      },
      error => {
        Log.error(error);
        _subscriber.error(error);
        this.resetSub();
      },
      () => {
        this.resetSub();
      });
  }


  resetSub() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }


  extractLines(log: any[]): string[] {
    const firstEntry = first(log);
    if (firstEntry) {
      return firstEntry.split('\n');
    }
    return [];
  }


  buildLog(log: any[]): string[] {
    let logs = log.filter((x: any) => !isEmpty(x));
    logs = logs.map((x: any) => JsonUtils.parse(x)).filter(x => has(x, 'message'));
    return logs
      .map((e: any) => e.message ?
        this.datePipe.transform(new Date(e.timestamp), 'yyyy-MM-dd HH:mm:ss.SSS') + ''
        + ' [' + e.level + '] ' + e.message
        :
        this.datePipe.transform(e.time, 'yyyy-MM-dd HH:mm:ss.SSS') + ''
        + ' [' + e.level + '] ' + e.args.join('\n'));
  }


  // getLog(from: number = 1, offset: number = 50) {
  //   this.tasksService.getTaskLog(this.runnerId, this.nodeId, from, offset).subscribe(x => {
  //       if (x) {
  //         this.append(x);
  //       }
  //     },
  //     error => {
  //       Log.debug(error);
  //     });
  // }


  append(x: string[]) {
    if (isUndefined(this.position) || !this.position) {
      this.position = 1;
    }
    if (isUndefined(this.log) || !this.log) {
      this.log = '';
    }
    const buildLines = this.buildLog(x);
    this.log += buildLines.join('\n') + '\n';
    this.maxlines += buildLines.length;
    // scroll to the bottom
    if (this.elemRef) {
      const logElem = this.elemRef.nativeElement;
      logElem.scrollTop = logElem.scrollHeight;
    }
    return buildLines.length;
  }


  finishUpdate() {
    // clearInterval(this.t);
  }


  ngOnDestroy(): void {
    this.resetSub();
    this.disableAutoUpdate();
    this.finishUpdate();
  }

}
