import {Component, Input} from '@angular/core';
import {DistributedStorageService} from '../../../services/distributed_storage.service';
import {DEFAULT_DS_OPTIONS, IDSOptions} from '../../../lib/IDSOptions';
import {AbstractQueryEmbeddedComponent} from '@typexs/base-ng';


/**
 * Storage query embedded component
 *
 * Possibilities:
 * - sorting
 * - filters
 * - extend/add specialized columns
 */
@Component({
  selector: 'txs-distributed-storage-query-embedded',
  templateUrl: './query-embedded.component.html',
  styleUrls: ['./query-embedded.component.scss']
})
export class DistributedStorageQueryEmbeddedComponent
  extends AbstractQueryEmbeddedComponent {

  @Input()
  iEntityName: string;

  @Input()
  options: IDSOptions = DEFAULT_DS_OPTIONS;


  constructor(private service: DistributedStorageService) {
    super();
    this.setQueryService(service);
  }

  // reset loading entity
  ngOnInit(): void {
    // pass entity name to name
    if (this.iEntityName && !this.name) {
      this.name = this.iEntityName;
    }
    if (!this.params) {
      this.params = {};
    }

    this.applyInitialOptions();
    if (this.iEntityName && !this.options.entityTypeSelection) {
      setTimeout(() => {
        this.requery();
      });
    }
  }

  changeEntityName(): void {
    this.name = this.iEntityName;
  }


}
