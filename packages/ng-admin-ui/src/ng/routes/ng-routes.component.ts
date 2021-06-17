import {Component, OnInit} from '@angular/core';
import {NavEntry, NavigatorService} from '@typexs/ng-router-menu';

@Component({
  selector: 'ng-routes',
  templateUrl: './ng-routes.component.html',
  styleUrls: ['./ng-routes.component.scss']
})
export class NgRoutesComponent implements OnInit {

  entries: NavEntry[];

  constructor(private navigatorService: NavigatorService) {
  }

  ngOnInit() {
    this.entries = this.navigatorService.getEntries();

  }
}
