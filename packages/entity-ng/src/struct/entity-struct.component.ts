// import {getMetadataStorage} from 'class-validator';
import { clone, filter } from 'lodash';
import { Component, OnInit } from '@angular/core';
import { EntityService } from './../entity.service';
import { ActivatedRoute, Router } from '@angular/router';
import { from, Observable } from 'rxjs';
import { IClassRef, IEntityRef, IPropertyRef, IValidatorEntry, METATYPE_PROPERTY, Validator } from '@allgemein/schema-api';


@Component({
  selector: 'entity-struct',
  templateUrl: './entity-struct.component.html',
  styleUrls: ['./entity-struct.component.scss']
})
export class EntityStructComponent implements OnInit {

  _name: Observable<string>;

  name: string;

  entityDef: IEntityRef;

  referrerProps: IPropertyRef[] = [];

  propertyDefs: { property: IPropertyRef; level: number }[] = [];

  validationEntries: IValidatorEntry[] = [];

  constructor(
    public entityService: EntityService,
    private route: ActivatedRoute,
    private router: Router) {

  }

  ngOnInit() {
    this.entityService.isReady(() => {
      this.route.params.subscribe((params => {
        if (params.name) {
          this.load(params.name);
        }
      }));
    });
  }

  load(name: string) {
    this.referrerProps = [];
    this.propertyDefs = [];

    this.name = name;
    this.entityDef = this.entityDef.getRegistry().getEntityRefFor(this.name);
    this.referrerProps = this.entityDef.getRegistry().filter(METATYPE_PROPERTY,
      (referrer: IPropertyRef) => referrer.isReference() && referrer.getTargetRef() === this.entityDef.getClassRef());
    this.scan(this.entityDef);
    from(Validator.getValidationEntries(this.entityDef)).subscribe((x: IValidatorEntry[]) => {
      this.validationEntries = x;
    });
  }


  type(propertyDef: IPropertyRef): string {
    if ((<any>propertyDef).isEmbedded()) {
      return propertyDef.getTargetRef().name;
    } else if (propertyDef.isReference()) {
      return propertyDef.getTargetRef().name;
    } else {
      return (<any>propertyDef).dataType;
    }
  }

  scan(source: IClassRef | IEntityRef, level: number = 0) {
    if (level > 8) {
      return;
    }
    for (const props of <IPropertyRef[]>source.getPropertyRefs()) {
      this.propertyDefs.push({ property: props, level: level });
      if (props.isReference()) {
        this.scan(props.getTargetRef(), level + 1);
        // } else if (!props.isInternal()) {
        //   this.scan(props.getTargetRef(), level + 1);
      }
    }
  }

  // validator(property: PropertyRef) {
  //   const validators = getMetadataStorage().getTargetValidationMetadatas(this.entityDef.getClass(), null, true, false);
  //   return filter(validators, v => v.propertyName === property.name);
  // }

  cardinality(propDef: IPropertyRef) {
    return propDef.getOptions('cardinality', 1);
  }

  options(propDef: IPropertyRef) {
    const opts = clone(propDef.getOptions());
    if (opts.sourceClass) {
      delete opts.sourceClass._cacheEntity;
    }
    return opts;
  }

  async validator(property: IPropertyRef) {
    return filter(this.validationEntries, v => v.property === property.name);
  }

}
