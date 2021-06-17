import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {AppService} from '@typexs/base-ng';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit {
  title = 'TypexsNg';


  constructor(private appState: AppService) {
    appState.getViewContext().subscribe(x => {
      console.log(x);
    });
  }

  getContext() {
    return this.appState.getViewContext();
  }

  ngOnInit() {
  }
}
