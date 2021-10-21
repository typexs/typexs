import {has, snakeCase} from 'lodash';
import {Injectable} from '@angular/core';
import {IMenuLinkGuard, NavEntry} from '@typexs/ng-router-menu';
import {BehaviorSubject, Observable, Subject} from 'rxjs';

@Injectable()
export class MenuAccessService implements IMenuLinkGuard {

  entry: { [k: string]: BehaviorSubject<boolean> } = {};

  change: Subject<boolean> = new Subject();

  switch(id: string, type: string = 'disabled') {

    if (this.entry[id + '.' + type]) {
      this.entry[id + '.' + type].next(!this.entry[id + '.' + type].getValue());
    }

  }

  has(k: string) {
    return has(this.entry, k);
  }


  isDisabled(entry: NavEntry): Observable<boolean> {
    const key = (entry.isGroup() ? snakeCase(entry.groupRegex) : entry.getPath()) + '.disabled';
    if (!this.entry[key]) {
      this.entry[key] = new BehaviorSubject(true);
      this.change.next(true);
    }
    return this.entry[key];
  }

  isShown(entry: NavEntry): Observable<boolean> {
    const key = (entry.isGroup() ? snakeCase(entry.groupRegex) : entry.getPath()) + '.show';
    if (!this.entry[key]) {
      this.entry[key] = new BehaviorSubject(true);
      this.change.next(true);
    }
    return this.entry[key];
  }

}
