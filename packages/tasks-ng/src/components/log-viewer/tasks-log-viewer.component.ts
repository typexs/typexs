import { first, has, isEmpty, isUndefined } from 'lodash';
import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { JsonUtils } from '@allgemein/base/utils/JsonUtils';
import { DatePipe } from '@angular/common';
import { interval, Observable, Subscriber, Subscription } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { Log } from '@typexs/base-ng';
import { BackendTasksService } from '../../services/backend-tasks.service';

/**
 * Show task log
 *
 * TODOs
 * - TODO: what should happened if task log entry is missing or log content is not found
 * - TODO: what should happend when log file is to long
 * - TODO: make logfile downloadable
 * - TODO: impl. own console output theme (like gitlab ci output)
 *
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

  @Input()
  mode: 'tail' | 'less' = 'less';

  _tail: number = 50;

  @Output()
  status: EventEmitter<any> = new EventEmitter<any>();

  @ViewChild('logPanel', { static: false })
  elemRef: ElementRef;

  count: number = 0;

  position: number = 0;

  maxlines: number = 0;

  fetchedLines: number = 0;

  fetchSize = 500;

  update: boolean;

  log: string = '';

  logError: string;

  subscription: Subscription = null;

  updateSubscription: Subscription = null;

  initialize: boolean = true;

  autoScroll: boolean = true;

  constructor(
    private tasksService: BackendTasksService,
    private datePipe: DatePipe) {
  }


  ngOnInit() {
    if (!(this.runnerId || this.nodeId)) {
      throw new Error('runnerId or nodeId not present');
    }

    if (this.autoUpdate && this.running) {
      this.enableAutoUpdate();
    } else {
      this.newLog();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    let reload = false;
    ['runnerId', 'nodeId'].forEach(x => {
      if (changes[x] && !changes[x].isFirstChange()) {
        reload = reload || changes[x].currentValue !== changes[x].previousValue;
      }
    });
    if (reload) {
      this.ngOnDestroy();
    } else {
      // const todo: 'new' | 'enable' | 'disable' = null;
      if (changes['running'] && changes['running'].currentValue !== changes['running'].previousValue) {
        if (!changes['running'].currentValue) {
          this.disableAutoUpdate();
        }
      }
      if (changes['autoUpdate'] && !changes['autoUpdate'].isFirstChange()) {
        if (changes['autoUpdate'].currentValue !== changes['autoUpdate'].previousValue) {
          if (changes['autoUpdate'].currentValue) {
            this.enableAutoUpdate();
          } else {
            this.disableAutoUpdate();
          }
        }
      }
      if (changes['mode'] && !changes['mode'].isFirstChange() && changes['mode'].currentValue !== changes['mode'].previousValue) {
        this.ngOnInit();
      }
    }
  }


  newLog() {
    this.reset();
    this.fetchData();
  }

  enableAutoUpdate() {
    if (!this.updateSubscription) {
      this.newLog();
      this.updateSubscription = interval(this.offset)
        .subscribe(
          x => {
            if (!this.subscription) {
              this.fetchData();
            }
          });
    }
  }


  disableAutoUpdate() {
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
      this.updateSubscription = undefined;
      // handle last
      setTimeout(() => this.fetchData(), this.offset);
    }
  }


  resetLog() {
    this.position = 0;
    this.maxlines = 0;
    this.fetchedLines = 0;
    this.log = '';
    // this.formattedLog = '';
    this.logError = '';
    this.status.emit({ type: 'reset', lines: 0 });
  }

  reset() {
    this.initialize = true;
    this.resetLog();
  }

  switchAutoScroll() {
    this.autoScroll = !this.autoScroll;
  }

  fetchData() {
    this.resetSub();
    switch (this.mode) {
      case 'tail':
        this.fetchTail();
        break;
      case 'less':
        this.fetchLess();
        break;
    }
  }


  /**
   * Fetch only tail of log data
   */
  fetchTail() {

    this.subscription = this.tasksService
      .getTaskLog(this.runnerId, this.nodeId, null, null, this._tail)
      .subscribe(x => {
          if (x) {
            this.resetLog();
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
          this.initialize = false;
        });
  }


  /**
   * Fetch data from beginning to the current end in chunked mode
   */
  fetchLess() {
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
          const lines = extractLines.length;
          this.fetchedLines += lines;
          const appended = this.append(extractLines);
          console.log(lines, appended)
          if (lines >= this.fetchSize - 1) {
            setTimeout(() => _subscriber.next(1));
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
          this.initialize = false;
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
        this.datePipe.transform(new Date(e.timestamp),
          'yyyy-MM-dd HH:mm:ss.SSS') + ' [' + e.level + '] ' + e.message
        :
        this.datePipe.transform(e.time,
          'yyyy-MM-dd HH:mm:ss.SSS') + ' [' + e.level + '] ' + e.args.join('\n'));
  }


  append(x: string[]) {
    if (isUndefined(this.position) || !this.position) {
      this.position = 1;
    }
    if (isUndefined(this.log) || !this.log) {
      this.log = '';
    }
    const fetchLines = x.length;
    const buildLines = this.buildLog(x);
    const lines = buildLines.length;
    if (lines > 0) {
      if (this.log) {
        this.log += '\n';
      }
      const log = buildLines.join('\n');
      this.log += log;
      this.maxlines += lines;
    }
    this.status.emit({ type: 'append', lines: fetchLines, appended: lines });
    return lines;
  }


  finishUpdate() {
    this.status.emit({ type: 'finished', lines: null });
  }


  ngOnDestroy(): void {
    this.resetSub();
    this.disableAutoUpdate();
    this.finishUpdate();
  }

  switchMode(tail: 'less' | 'tail') {
    this.mode = tail;
    this.resetSub();
    this.ngOnInit();
  }
}
