import {Component} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {StorageService} from '../../storage.service';
import {StorageAggregateEmbeddedComponent} from '../embedded/storage-aggregate-embedded.component';


@Component({
  selector: 'txs-storage-aggregate',
  templateUrl: './storage-aggregate.component.html',
  styleUrls: ['./storage-aggregate.component.scss']
})
export class StorageAggregateComponent extends StorageAggregateEmbeddedComponent {


  constructor(public _storageService: StorageService,
              public _route: ActivatedRoute) {
    super(_storageService, _route);
  }


}
