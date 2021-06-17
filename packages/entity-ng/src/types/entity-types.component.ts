import {Component} from '@angular/core';
import {EntityService} from './../entity.service';
import {EntityRef} from '@typexs/schema';


@Component({
  selector: 'entity-types',
  templateUrl: './entity-types.component.html'
})
export class EntityTypesComponent {

  constructor(public entityService: EntityService) {
  }

  getEntityRefs() {
    return this.entityService.getEntityRefs().filter(e => (e as EntityRef).isStorable());
  }
}
