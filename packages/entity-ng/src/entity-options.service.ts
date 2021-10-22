import { Injectable } from '@angular/core';
import { EntityService } from './entity.service';
// import { EntityRef, K_STORABLE, PropertyRef } from '@typexs/schema';
import { BehaviorSubject, Observable } from 'rxjs';
import { ISelectOptionsService } from '@typexs/ng-forms';
import { ISelectOption } from '@typexs/ng/lib/forms/elements/ISelectOption';
import { IClassRef, IEntityRef, IPropertyRef } from '@allgemein/schema-api';
import { Log } from '@typexs/base-ng';
import { K_STORABLE } from '@typexs/schema';
import { Expressions } from '@allgemein/expressions';
import { LabelHelper } from '../../base/src';

@Injectable()
export class EntityOptionsService implements ISelectOptionsService {


  constructor(private entityService: EntityService) {
  }


  options(propertyDef: IPropertyRef, limit: number = 25, page: number = 0): Observable<ISelectOption[]> {
    const bs = new BehaviorSubject<ISelectOption[]>(null);

    let storeable = true;
    let sourceRef: IClassRef | IEntityRef = propertyDef.getClassRef();
    if (sourceRef.hasEntityRef()) {
      sourceRef = sourceRef.getEntityRef();
      storeable = sourceRef.getOptions(K_STORABLE);
      if (storeable !== false) {
        storeable = true;
      }
    }

    if (storeable && propertyDef.getTargetRef().hasEntityRef()) {
      const entityDef = <IEntityRef>propertyDef.getTargetRef().getEntityRef();
      this.entityService.query(entityDef.name, null, { limit: limit }).subscribe(
        result => {
          if (result) {
            const _entities: ISelectOption[] = [];

            if (result.entities) {
              result.entities.forEach((e: any) => {
                const option: ISelectOption = {};
                option.value = Expressions.buildLookupConditions(entityDef, e);
                option.label = LabelHelper.labelForEntity(e, entityDef);
                _entities.push(option);
              });
            }

            bs.next(_entities);
          }
        },
        (e: Error) => {
          Log.error(e);
        },
        () => {
          bs.complete();
        }
      );
    } else {
      if (storeable) {
        bs.error(new Error('no entity as target in property'));
      } else {
        bs.error(new Error('is not a storable entity'));
      }

    }

    return bs.asObservable();

  }


}
