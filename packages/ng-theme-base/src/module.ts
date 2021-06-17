import {NgModule, Provider} from '@angular/core';
import {RouterModule} from '@angular/router';
import {RouterMenuModule} from '@typexs/ng-router-menu';
import {FormsModule} from '@typexs/ng-forms';
import {BaseModule} from '@typexs/base-ng';
import {BaseAdminThemeComponent} from './base_admin_theme.component';
import {ToggleDirective} from './toggle.directive';
import {PerfectScrollbarDirective} from './perfect-scrollbar.directive';
import {WrapperComponent} from './components/wrapper/wrapper.component';
import {CardComponent} from './components/card/card.component';
import {NotificationsComponent} from './components/notifications/notifications.component';
import {NotificationsService} from './components/notifications/notifications.service';
import {CommonModule} from '@angular/common';

const PROVIDERS: Provider[] = [
  NotificationsService
];

const COMPONENTS = [
  WrapperComponent,
  CardComponent,
  BaseAdminThemeComponent,
  ToggleDirective,
  PerfectScrollbarDirective,
  NotificationsComponent

];

@NgModule({
  declarations: COMPONENTS,
  imports: [
    CommonModule,
    RouterMenuModule,
    BaseModule,
    RouterModule,
    FormsModule
  ],
  exports: COMPONENTS,
  providers: PROVIDERS
})
export class BaseAdminThemeModule {


  static forRoot() {
    return {
      ngModule: BaseAdminThemeModule,
      providers: PROVIDERS
    };
  }


}
