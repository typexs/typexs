import {Component} from '@angular/core';
import {StorageService} from '../storage.service';


@Component({
  selector: 'storage-types',
  templateUrl: './storage-types.component.html'
})
export class StorageTypesComponent {

  constructor(public storageService: StorageService) {
  }

  getEntityRefs() {
    const entityRefs = this.storageService.getEntityRefs();
    return entityRefs;
  }
}
