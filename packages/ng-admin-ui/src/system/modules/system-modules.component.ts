import {keys} from 'lodash';
import {Component, OnInit} from '@angular/core';
import {IModule} from '@typexs/base/api/IModule';


import {SystemInfoService} from '@typexs/base-ng';

@Component({
  selector: 'system-modules',
  templateUrl: './system-modules.component.html'
})
export class SystemModulesComponent implements OnInit {

  modules: IModule[] = [];

  constructor(private infoService: SystemInfoService) {
  }

  objectKeys(obj: any) {
    return keys(obj);
  }


  ngOnInit() {
    this.infoService.loadModules((err: Error, x: IModule[]) => {
      if (x) {
        this.modules = x;
      }
    });
  }
}
