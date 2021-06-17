import {Component, Input} from '@angular/core';
import {UI_ADMIN_LAYOUT} from './lib/Constants';
import {AppService} from '@typexs/base-ng';

@Component({
  selector: 'admin',
  templateUrl: './admin.component.html'
})
export class AdminComponent {

  @Input()
  enableLayout: boolean = true;

  constructor(private appService: AppService) {
    this.enableLayout = this.appService.getSettings(UI_ADMIN_LAYOUT, true);
  }

}
