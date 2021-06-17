import {isArray, keys} from 'lodash';
import {Component, OnInit} from '@angular/core';
import {ITypexsOptions} from '@typexs/base/libs/ITypexsOptions';
import {SystemInfoService} from '@typexs/base-ng';


@Component({
  selector: 'system-config',
  templateUrl: './system-config.component.html'
})
export class SystemConfigComponent implements OnInit {

  config: ITypexsOptions = {};


  constructor(private infoService: SystemInfoService) {
  }

  objectKeys(obj: any) {
    return keys(obj);
  }


  ngOnInit() {
    this.infoService.loadConfig((err: Error, x: ITypexsOptions[]) => {
      if (isArray(x)) {
        this.config = x.shift();
      } else {
        this.config = x;
      }
    });
  }

  stringify(x: any) {
    return JSON.stringify(x, null, 2);
  }
}
