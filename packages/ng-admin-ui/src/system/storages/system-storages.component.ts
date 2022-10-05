import { keys } from 'lodash';
import { Component, OnInit } from '@angular/core';
import { SystemInfoService } from '@typexs/base-ng';
import { IStorageRefOptions } from '@typexs/base';


const API_CTRL_URL = '/api/storages';

@Component({
  selector: 'system-storages',
  templateUrl: './system-storages.component.html'
})
export class SystemStoragesComponent implements OnInit {

  storages: IStorageRefOptions[] = [];


  constructor(private infoService: SystemInfoService) {
  }

  objectKeys(obj: any) {
    return keys(obj);
  }


  ngOnInit() {
    this.infoService.loadStorages((err: Error, x: IStorageRefOptions[]) => {
      if (x) {
        this.storages = x;
      }
    });
  }
}
