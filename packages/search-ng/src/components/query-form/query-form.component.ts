
import {distinctUntilChanged, debounceTime} from 'rxjs/operators';
import * as _ from 'lodash';
import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';

import {ExprDesc, Expressions} from '@allgemein/expressions';
import {QueryAction} from './QueryAction';
import {Log} from '@typexs/base-ng';
import {Subject, Subscription} from 'rxjs';


@Component({
  selector: 'txs-search-query-form',
  templateUrl: './query-form.component.html',
  styleUrls: ['./query-form.component.scss']
})
export class SearchQueryFormComponent implements OnInit, OnDestroy {


  @Input()
  mode: 'aggregate' | 'query' = 'query';

  @Input()
  lines: number = 1;

  @Input()
  enableHistory: boolean = true;

  @Output()
  queryState: EventEmitter<QueryAction> = new EventEmitter();


  /**
   * Query changed observable
   */
  queryChanged: Subject<string> = new Subject<string>();


  history: { mode: 'aggregate' | 'query'; text: string; query: any }[] = [];

  historyToggle: boolean = false;

  query = '';

  queryError: string[] = [];

  jsonQuery: any = null;

  enabled: boolean = false;

  subscription: Subscription;

  constructor() {

  }

  ngOnInit() {

    this.subscription = this.queryChanged.pipe(
      // debounce 1 second
      debounceTime(500),
      // only fire for distinct values
      distinctUntilChanged(),)
      .subscribe((model) => {
        // set query
        this.query = model;
        this.build();
        // this.doQuery();
      });

    try {
      const value = localStorage.getItem('txs.query.history');
      this.history = JSON.parse(value);
      if (!this.history || !_.isArray(this.history)) {
        this.history = [];
      }

    } catch (e) {

    }
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
    if (this.jsonQuery && this.queryError.length === 0) {
      this.queryState.emit(new QueryAction(this.jsonQuery, this.mode));
      const found = this.history.find(x =>
        x.mode === this.mode &&
        x.text === this.query
      );
      if (!found) {
        this.history.push({mode: this.mode, text: this.query, query: this.jsonQuery});
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

  selectEntry(entry: { mode: 'aggregate' | 'query'; text: string; query: any }) {
    this.mode = entry.mode;
    this.query = entry.text;
    this.build();
  }

  doResetQuery() {
    this.queryState.emit(new QueryAction(null, this.mode));
  }

  onQueryInput(query: any) {
    this.queryChanged.next(query);
  }

  build() {
    this.queryError = [];
    if (!_.isEmpty(this.query)) {
      const errors: string[] = [];
      if (this.mode === 'query') {
        if (/>=|<=|<>|<|>|in|IN|like|LIKE|\s(AND|OR|or|and)\s/.test(this.query)) {
          try {
            const expr = Expressions.parse(this.query);
            if (expr) {
              this.jsonQuery = expr;
              this.queryError = errors;
            } else {
              this.jsonQuery = this.query;
            }
          } catch (e) {
            this.jsonQuery = this.query;
            Log.warn(e.message);
          }
        } else {
          this.jsonQuery = this.query;
        }
      } else {
        try {
          this.jsonQuery = JSON.parse(this.query);
        } catch (e) {
          this.queryError.push(e.message);
        }

        this.queryError = errors;
        if (_.isEmpty(this.jsonQuery)) {
          this.queryError.push('Object or array is empty.');
        }
      }
    }
  }
}
