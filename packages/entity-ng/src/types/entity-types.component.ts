import { Component } from '@angular/core';
import { EntityService } from './../entity.service';
import { IEntityRef } from '@allgemein/schema-api';
import { K_STORABLE } from '@typexs/entity/libs/Constants';


@Component({
  selector: 'entity-types',
  templateUrl: './entity-types.component.html'
})
export class EntityTypesComponent {

  constructor(public entityService: EntityService) {
  }

  getEntityRefs(): IEntityRef[] {
    return this.entityService.getEntityRefs().filter(e => (e as IEntityRef).getOptions(K_STORABLE, true));
  }
}
