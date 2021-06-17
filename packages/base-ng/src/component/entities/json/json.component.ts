import {Component, Inject} from '@angular/core';
import {AbstractEntityViewComponent} from '../abstract-entity-view.component';
import {EntityResolverService} from '../../../services/entity-resolver.service';


@Component({
  selector: 'txs-simple-json',
  templateUrl: 'json.component.html',
  styleUrls: ['./json.component.scss']
})
export class JsonComponent extends AbstractEntityViewComponent<any> {


  constructor(@Inject(EntityResolverService) public resolverService: EntityResolverService) {
    super(resolverService);
  }
}
