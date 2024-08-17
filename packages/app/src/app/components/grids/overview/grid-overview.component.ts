import { Component, OnInit } from '@angular/core';
import { IMenuOptions } from '@typexs/ng-router-menu';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'gridDemo',
  templateUrl: 'grid-overview.component.html'
})
export class GridOverviewComponent implements OnInit {

  options: IMenuOptions = {
    base: 'demo/grids'
  };

  constructor(private active: ActivatedRoute) {
  }

  ngOnInit() {
    // TODO read current path of component to add to
    // const x = this.active.snapshot.url;
    // let y = 0;

  }

}
