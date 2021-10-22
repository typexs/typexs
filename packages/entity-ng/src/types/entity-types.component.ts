import { Component } from '@angular/core';
import { EntityService } from './../entity.service';
import { EntityRef } from '@typexs/schema';
import { IEntityRef } from '@allgemein/schema-api';


@Component({
  selector: 'entity-types',
  templateUrl: './entity-types.component.html'
})
export class EntityTypesComponent {

  constructor(public entityService: EntityService) {
  }

  getEntityRefs(): IEntityRef[] {
    return this.entityService.getEntityRefs().filter(e => (e as EntityRef).isStorable());
  }
}
