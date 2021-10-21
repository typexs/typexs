import {ChangeDetectorRef, Component} from '@angular/core';
import {MenuAccessService} from './MenuAccessService';
import {NavigatorService} from '@typexs/ng-router-menu';


@Component({
  selector: 'menu-demo',
  templateUrl: 'menu-demo.component.html',
})
export class MenuDemoComponent {


  constructor(
    public mas: MenuAccessService,
    private cdRef: ChangeDetectorRef,
    private navigatorService: NavigatorService) {
    mas.change.asObservable().subscribe(x => {
      cdRef.detectChanges();
    });
    navigatorService.addGroupEntry('menu-grouped/.*', {label: 'Menu Group', canActivate: [MenuAccessService]});
  }

  has() {
    return this.mas && this.mas.has('menu-item-2.disabled') && this.mas.has('menu-item-2.show');
  }

  hasGrouped() {
    return this.mas && this.mas.has('menu-group-item-2.disabled') && this.mas.has('menu-group-item-2.show');
  }

}
