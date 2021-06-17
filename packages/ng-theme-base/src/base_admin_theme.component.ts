import {isBoolean, values} from 'lodash';
import {ChangeDetectorRef, Component, Input, OnDestroy, OnInit, Renderer2, TemplateRef, ViewEncapsulation} from '@angular/core';
import {IUser} from '@typexs/ng';
import PerfectScrollbar from 'perfect-scrollbar';
import {IMenuOptions, NavigatorService} from '@typexs/ng-router-menu';
import {AppService, CTXT_ROUTE_USER_LOGOUT, CTXT_ROUTE_USER_PROFILE, Log, LogMessage, SystemInfoService} from '@typexs/base-ng';
import {INotifyOptions} from './components/notifications/INotifyOptions';
import {NotificationsService} from './components/notifications/notifications.service';
import {of, Subscription} from 'rxjs';
import {switchMap} from 'rxjs/operators';


@Component({
  selector: 'bat-admin-layout',
  templateUrl: './base_admin_theme.component.html',
  styleUrls: ['./base_admin_theme.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class BaseAdminThemeComponent implements OnInit, OnDestroy {

  // tslint:disable-next-line:no-input-rename
  @Input('content')
  ref: TemplateRef<any>;

  @Input()
  title = 'TypeXs';

  @Input()
  menuOptions: IMenuOptions = {};

  @Input()
  notifyOptions: INotifyOptions = {
    displayTime: 5000,
    maxAlerts: 5
  };

  @Input()
  baseRouterLink = '/';

  @Input()
  userRouterLinks: { profile: string; logout: string } = {profile: 'user/profile', logout: 'user/logout'};

  user: IUser;

  menuScrollBar: PerfectScrollbar;

  viewContext: string;

  requestCount: number = 0;

  private subscription: Subscription = new Subscription();


  constructor(
    public renderer: Renderer2,
    public appStateService: AppService,
    private systemService: SystemInfoService,
    private navigatorService: NavigatorService,
    private notifyService: NotificationsService,
    private cdRef: ChangeDetectorRef
  ) {

  }


  onLogMessage(log: LogMessage) {
    if (!log) {
      return;
    }

    if (log.isErrorMessage()) {
      Log.error(log.error);
    }
    this.notifyService.addMessage(log);
  }

  getSystemService() {
    return this.systemService;
  }

  getAuthService() {
    return this.appStateService.getAuthService();
  }

  getBackendService() {
    return this.appStateService.getBackendClient();
  }

  getUser() {
    return this.appStateService.getAuthService().getUser();
  }


  async ngOnInit() {
    const subs: any = {};
    subs.context = this.appStateService.getViewContext().subscribe(x => {
      this.viewContext = x;
      this.cdRef.detectChanges();
    });
    subs.log = this.appStateService.getLogService().subscribe(this.onLogMessage.bind(this));
    if (this.appStateService.getBackendClient()['getActiveCount']) {
      subs.count = this.appStateService.getBackendClient()['getActiveCount']().subscribe((x: number) => {
        this.requestCount = x;
        this.cdRef.detectChanges();
      });
    }
    subs.auth = this.getAuthService().isInitialized()
      .pipe(switchMap(x => {
        if (x) {
          return this.getAuthService().isLoggedIn();
        } else {
          return of(x);
        }
      }))
      .pipe(switchMap(x => {
        if (x) {
          return this.getUser();
        } else {
          return of(false);
        }
      }))
      .subscribe(x => {
        if (x && !isBoolean(x)) {
          this.user = x;
          this.getSystemService().refresh();
        }
      }, error => Log.error(error));

    values(subs).map(x => this.subscription.add(x));
    let entry = this.navigatorService.getEntryByContext(CTXT_ROUTE_USER_PROFILE);
    if (entry) {
      this.userRouterLinks.profile = '/' + entry.getFullPath();
    }
    entry = this.navigatorService.getEntryByContext(CTXT_ROUTE_USER_LOGOUT);
    if (entry) {
      this.userRouterLinks.logout = '/' + entry.getFullPath();
    }
    await this.enableMenuScrollBar();
  }


  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }


  async enableMenuScrollBar() {
    const _$ = document.querySelector;
    const classList = document.querySelector('.txs-navbar').classList;
    if (!classList.contains('theme-horizontal')) {
      const minScrollbarLength = 40;
      const minScrollbarYOffset = 0;
      const vw = window.innerWidth;
      if (vw < 992 || classList.contains('menupos-static')) {
        this.menuScrollBar = new PerfectScrollbar('.navbar-content', {
          wheelSpeed: .5,
          swipeEasing: false,
          suppressScrollX: true,
          wheelPropagation: true,
          minScrollbarLength: minScrollbarLength,
          scrollYMarginOffset: minScrollbarYOffset

        });
      } else {
        this.menuScrollBar = new PerfectScrollbar('.navbar-content', {
          wheelSpeed: .5,
          swipeEasing: false,
          suppressScrollX: true,
          wheelPropagation: true,
          minScrollbarLength: minScrollbarLength,
          scrollYMarginOffset: minScrollbarYOffset
        });
      }
    }

  }


  togglemenu() {
    const vw = window.innerWidth;
    const elem = document.querySelector('.txs-navbar');
    const classList = elem.classList;
    if (classList.contains('theme-horizontal') === false) {
      if (vw <= 1200 && vw >= 992) {
        this.renderer.addClass(elem, 'navbar-collapsed');
      }
      if (vw < 992) {
        this.renderer.removeClass(elem, 'navbar-collapsed');
      }
    }
  }


}
