import { Component, OnInit } from '@angular/core';
import { StorageService } from '../storage.service';
import { IStorageRefMetadata } from '@typexs/storage';
import { keys } from 'lodash';


export interface IStorageBackend extends IStorageRefMetadata {
  entitiesCount: number;
}

@Component({
  selector: 'txs-storage-backends',
  templateUrl: './storage-backends.component.html'
})
export class StorageBackendsComponent implements OnInit {

  // storages: IStorageRefMetadata[];

  backends: IStorageBackend[] = [];

  constructor(private storageService: StorageService) {
  }

  ngOnInit(): void {
    this.getStorages();
  }


  getStorages() {
    this.storageService.getStorages().subscribe((backends: IStorageRefMetadata[]) => {
      this.backends = [];
      if (backends) {
        for (const backend of backends) {
          const e: IStorageBackend = backend as IStorageBackend;
          e.entitiesCount =  Object.keys(backend.schema.definitions).length;
          this.backends.push(e);
        }
      }
    });
  }
}
