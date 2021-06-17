import {keys} from 'lodash';
import {Component, OnInit} from '@angular/core';
import {IStorageOptions} from '@typexs/base/libs/storage/IStorageOptions';
import {SystemInfoService} from '@typexs/base-ng';


const API_CTRL_URL = '/api/storages';

@Component({
  selector: 'system-storages',
  templateUrl: './system-storages.component.html'
})
export class SystemStoragesComponent implements OnInit {

  storages: IStorageOptions[] = [];


  constructor(private infoService: SystemInfoService) {
  }

  objectKeys(obj: any) {
    return keys(obj);
  }


  ngOnInit() {
    this.infoService.loadStorages((err: Error, x: IStorageOptions[]) => {
      if (x) {
        this.storages = x;
      }
    });
  }
}
