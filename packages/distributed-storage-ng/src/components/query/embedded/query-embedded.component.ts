import { Component, Input } from '@angular/core';
import { DistributedStorageService } from '../../../services/distributed_storage.service';
import { DEFAULT_DS_OPTIONS, IDSOptions } from '../../../lib/IDSOptions';
import { AbstractQueryComponent } from '@typexs/base-ng';


/**
 * Storage query embedded component
 *
 * Possibilities:
 * - sorting
 * - filters
 * - extend/add specialized columns
 *
 */
@Component({
  selector: 'txs-distributed-storage-query-embedded',
  templateUrl: './query-embedded.component.html',
  styleUrls: ['./query-embedded.component.scss']
})
export class DistributedStorageQueryEmbeddedComponent
  extends AbstractQueryComponent {

  @Input()
  entityName: string;

  @Input()
  options: IDSOptions = DEFAULT_DS_OPTIONS;


  constructor(private service: DistributedStorageService) {
    super();
    this.setQueryService(service);
  }

  /**
   * Impl. of OnInit method
   */
  ngOnInit(): void {
    // pass entity name to name
    if (this.entityName && !this.name) {
      this.name = this.entityName;
    }

    super.ngOnInit();
  }

  /**
   * Do not initialize entity ref
   */
  initializeEntityRef() {
  }

  // ngAfterViewInit() {
  //   if (this.entityName && !this.options.entityTypeSelection) {
  //     setTimeout(() => {
  //       this.requery();
  //     });
  //   }
  // }

  changeEntityName(): void {
    this.name = this.entityName;
  }


}
