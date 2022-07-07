import { Component, OnInit } from '@angular/core';
import { IMenuOptions } from '@typexs/ng-router-menu';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'tablesDemo',
  templateUrl: 'tables-overview.component.html'
})
export class TablesOverviewComponent implements OnInit {

  options: IMenuOptions = {
    base: 'demo/tables'
  };

  constructor(private active: ActivatedRoute) {
  }

  ngOnInit() {
    // TODO read current path of component to add to
    // const x = this.active.snapshot.url;
    // let y = 0;

  }

}
