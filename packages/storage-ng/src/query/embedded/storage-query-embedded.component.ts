import {Component} from '@angular/core';
import {AbstractQueryComponent} from '@typexs/base-ng';
import {StorageService} from '../../storage.service';


/**
 * Storage query embedded component
 *
 * Possibilities:
 * - sorting
 * - filters
 * - extend/add specialized columns
 */
@Component({
  selector: 'txs-storage-query-embedded',
  templateUrl: './storage-query-embedded.component.html',
  styleUrls: ['./storage-query-embedded.component.scss']
})
export class StorageQueryEmbeddedComponent extends AbstractQueryComponent {


  constructor(private storageService: StorageService) {
    super();
    this.setQueryService(storageService);
  }


}
