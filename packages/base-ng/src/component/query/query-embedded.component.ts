import { ChangeDetectorRef, Component, ContentChild, Input, ViewChild } from '@angular/core';
import { IQueringService } from '../../api/querying/IQueringService';
import { AbstractQueryComponent } from '../../api/querying/abstract-query.component';
import { EntityResolverService } from '../../services/entity-resolver.service';
import { DatatableComponent } from '../../datatable/datatable.component';


/**
 * Query embedded component for all query services
 *
 * Possibilities:
 * - sorting
 * - filters
 * - extend/add specialized columns
 */
@Component({
  selector: 'txs-query-embedded',
  templateUrl: './query-embedded.component.html',
  styleUrls: ['./query-embedded.component.scss']
})
export class QueryEmbeddedComponent extends AbstractQueryComponent {

  @Input()
  get service() {
    return this.getQueryService();
  }

  set service(service: IQueringService) {
    this.setQueryService(service);
  }

  constructor(private resolver: EntityResolverService) {
    super();
  }

  getQueryService(): IQueringService {
    if (!this.hasQueryService()) {
      const service = this.findServiceForEntity();
      this.setQueryService(service);
    }
    return super.getQueryService();
  }

  findServiceForEntity() {
    const entityName = this.getEntityName();
    const entityRef = this.resolver.getEntityRef(entityName);
    if (!entityRef) {
      throw new Error(`No entity reference found for ${entityName}`);
    }
    const service = this.resolver.getServiceForEntity(entityRef);
    if (!service) {
      throw new Error(`No service found for entity reference of ${entityName}`);
    }
    return service;
  }
}
