import {isArray, isEmpty} from 'lodash';
import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {ExprDesc, Expressions} from '@allgemein/expressions';
import {QueryAction} from '../QueryAction';
import {Log} from '../../../lib/log/Log';
import {Subject, Subscription} from 'rxjs';
import {debounceTime, distinctUntilChanged} from 'rxjs/operators';


@Component({
  selector: 'txs-free-query-input',
  templateUrl: './free-query-input.component.html',
  styleUrls: ['./free-query-input.component.scss']
})
export class FreeQueryInputComponent implements OnInit, OnDestroy {


  @Input()
  mode: 'aggregate' | 'query' = 'query';

  @Input()
  lines: number = 1;

  @Input()
  enableHistory: boolean = true;

  @Output()
  queryState: EventEmitter<QueryAction> = new EventEmitter();

  history: { mode: 'aggregate' | 'query', text: string, query: any }[] = [];

  historyToggle: boolean = false;

  /**
   * Query changed observable
   */
  queryChanged: Subject<string> = new Subject<string>();


  subscription: Subscription;

  freeTextQuery = '';

  freeTextQueryError: string[] = [];

  jsonQuery: any = null;

  enabled: boolean = false;

  constructor() {

  }

  ngOnInit() {
    this.subscription = this.queryChanged
      .pipe(debounceTime(500))
      .pipe(distinctUntilChanged())
      .subscribe(this.onQueryChange.bind(this));

    try {
      const value = localStorage.getItem('txs.query.history');
      this.history = JSON.parse(value);
      if (!this.history || !isArray(this.history)) {
        this.history = [];
      }
    } catch (e) {
    }
  }

  onQueryChange(model: string) {
    this.freeTextQuery = model;
    this.build();
  }

  onQueryInput($event: any) {
    this.queryChanged.next($event);
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    try {
      localStorage.setItem('txs.query.history', JSON.stringify(this.history));
    } catch (e) {

    }
  }

  toggleHistory() {
    Log.debug('history toggle ', this.history);
    this.historyToggle = !this.historyToggle;
  }

  doQuery() {
    if (this.jsonQuery && this.freeTextQueryError.length === 0) {
      this.queryState.emit(new QueryAction(this.jsonQuery, this.mode));
      const found = this.history.find(x =>
        x.mode === this.mode &&
        x.text === this.freeTextQuery
      );
      if (!found) {
        this.history.push({mode: this.mode, text: this.freeTextQuery, query: this.jsonQuery});
        while (this.history.length >= 100) {
          this.history.shift();
        }
      }
    }
  }

  getQuery() {
    return this.jsonQuery instanceof ExprDesc ? this.jsonQuery.toJson() : this.jsonQuery;
  }

  stop($event: any) {
    $event.stopPropagation();
  }

  selectEntry(entry: { mode: 'aggregate' | 'query', text: string, query: any }) {
    this.mode = entry.mode;
    this.freeTextQuery = entry.text;
    this.build();
  }

  doResetQuery() {
    this.queryState.emit(new QueryAction(null, this.mode));
  }


  build() {
    this.freeTextQueryError = [];
    if (!isEmpty(this.freeTextQuery)) {
      try {
        const errors: string[] = [];
        if (this.mode === 'query') {
          const expr = Expressions.parse(this.freeTextQuery);
          if (expr) {
            this.jsonQuery = expr;
            this.freeTextQueryError = errors;
          } else {
            this.freeTextQueryError.push('No parsable data.');
          }
        } else {
          this.jsonQuery = JSON.parse(this.freeTextQuery);
          this.freeTextQueryError = errors;
          if (isEmpty(this.jsonQuery)) {
            this.freeTextQueryError.push('Object or array is empty.');
          }
        }
      } catch (e) {
        this.freeTextQueryError.push(e.message);
      }
    }
  }
}
