import {get, isArray, isEmpty} from 'lodash';
import {Component, Injector, Input, OnDestroy, OnInit} from '@angular/core';
import {INavTreeEntry} from './INavTreeEntry';
import {IMenuLinkGuard} from './IMenuLinkGuard';
import {BehaviorSubject, of, Subscription, TeardownLogic} from 'rxjs';
import {mergeMap} from 'rxjs/operators';


@Component({
  selector: 'menu-link',
  templateUrl: './menu-link.component.html',
  styleUrls: ['./menu-link.component.scss']
})
export class MenuLinkComponent implements OnInit, OnDestroy {

  @Input()
  entry: INavTreeEntry;

  activators: IMenuLinkGuard[] = null;

  isDisabled$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  isShown$: BehaviorSubject<boolean> = new BehaviorSubject(true);

  private subscriptions: Subscription;


  constructor(private injector: Injector) {
  }


  ngOnInit(): void {
    const activators = this.getActivator();
    if (!isEmpty(activators)) {
      for (const canAct of activators) {
        if (canAct.isDisabled) {
          const s = (<IMenuLinkGuard>canAct).isDisabled(this.entry.entry)
            .subscribe(
              x => this.isDisabled$.next(x), err => this.isDisabled$.error(err), () => this.isDisabled$.complete()
            );
          this.addSub(s);
        }
        if (canAct.isShown) {
          const s = (<IMenuLinkGuard>canAct).isShown(this.entry.entry)
            .subscribe(
              x => this.isShown$.next(x), err => this.isShown$.error(err), () => this.isShown$.complete()
            );
          this.addSub(s);
        }
      }
    }
  }


  isActive() {
    if (this.isCaption()) {
      return this.isShown$
        .pipe(mergeMap(x => !x ? this.isDisabled$ : of(true)));
    }
    return this.isShown$;
  }


  isCaptionShown() {
    if (this.isCaption()) {
      return this.isShown$;
    } else {
      return of(false);
    }
  }


  isCaption() {
    return this.entry.isGroup;
  }


  hasChildren() {
    return this.entry.children && this.entry.children.length > 0;
  }


  private getActivator() {
    if (this.activators) {
      return this.activators;
    }
    this.activators = [];
    const canActivate = this.entry.entry.getCanActivate();
    if (canActivate && isArray(canActivate)) {
      for (const canAct of canActivate) {
        const guard = this.injector.get(canAct) as IMenuLinkGuard;
        if (guard.isDisabled || guard.isShown) {
          this.activators.push(guard);
        }
      }
    }
    return this.activators;
  }


  icon() {
    const icon = get(this.entry, 'entry.data.icon', null);
    if (icon) {
      return icon;
    }
    if (this.entry.isGroup) {
      return 'icon-' + this.entry.entry.groupRegex.replace(/[^\w\d]/g, '-').replace(/-+$/, '');
    } else {
      return 'icon-' + this.entry.path.replace(/[^\w\d]/g, '-');
    }

  }

  ngOnDestroy() {
    if (this.subscriptions) {
      this.subscriptions.unsubscribe();
    }
  }

  private addSub(t: TeardownLogic) {
    if (!this.subscriptions) {
      this.subscriptions = new Subscription();
    }
    this.subscriptions.add(t);
  }
}
