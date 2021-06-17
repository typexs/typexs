import {Component, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {SystemInfoService} from '@typexs/base-ng';
import {IWorkerInfo} from '@typexs/base/libs/worker/IWorkerInfo';
import {Observable, Subscription, timer} from 'rxjs';
import {mergeMap} from 'rxjs/operators';

@Component({
  selector: 'dashboard',
  templateUrl: './dashboard.component.html',
  encapsulation: ViewEncapsulation.None
})
export class DashboardComponent implements OnInit, OnDestroy {

  subscriptions: Subscription = new Subscription();

  pushTimer: Observable<boolean> = null;

  interval = 5000;

  workerInfos: IWorkerInfo[] = [];


  constructor(private infoService: SystemInfoService) {

  }


  infos() {
    return this.infoService;
  }


  ngOnInit() {
    // this.infoService.refresh();
    this.infoService.loadWorkers((err, workerInfos) => {
      if (!err) {
        this.workerInfos = workerInfos;
      }
    });


    this.pushTimer = timer(0, this.interval).pipe(mergeMap(x => this.infoService.refresh()));
    this.subscriptions.add(this.pushTimer.subscribe(x => {
    }));
  }


  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

}
