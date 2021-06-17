import {Component, OnInit} from '@angular/core';
import {StorageService} from '../storage.service';
import {IStorageRefMetadata} from '@typexs/server';


@Component({
  selector: 'txs-storage-backends',
  templateUrl: './storage-backends.component.html'
})
export class StorageBackendsComponent implements OnInit {

  storages: IStorageRefMetadata[];

  constructor(private storageService: StorageService) {
  }

  ngOnInit(): void {
    this.getStorages();
  }


  getStorages() {
    this.storageService.getStorages().subscribe((e: any) => {
      this.storages = e;
    });
  }
}
