import {Component, Input} from '@angular/core';
import {IQueringService} from '../../api/querying/IQueringService';
import {AbstractQueryComponent} from '../../api/querying/abstract-query.component';


/**
 * Storage query embedded component
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

}
