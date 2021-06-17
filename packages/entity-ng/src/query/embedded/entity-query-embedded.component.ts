import {Component} from '@angular/core';
import {AbstractQueryEmbeddedComponent} from '@typexs/base-ng';
import {EntityService} from '../../entity.service';


/**
 * Storage query embedded component
 *
 * Possibilities:
 * - sorting
 * - filters
 * - extend/add specialized columns
 */
@Component({
  selector: 'txs-entity-query-embedded',
  templateUrl: './entity-query-embedded.component.html',
  styleUrls: ['./entity-query-embedded.component.scss']
})
export class EntityQueryEmbeddedComponent extends AbstractQueryEmbeddedComponent {

  constructor(private entityService: EntityService) {
    super();
    this.setQueryService(entityService);
  }

}
