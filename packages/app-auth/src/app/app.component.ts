import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {AppService, AuthService} from '@typexs/base-ng';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit {
  title = 'app';

  constructor(public auth: AuthService, private appService: AppService) {
    appService.getViewContext().subscribe(x => console.log(x));
  }


  async ngOnInit() {
  }


  isAuthenticated() {
    return this.auth.isLoggedIn();
  }
}


