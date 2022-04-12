// import {getMetadataStorage} from 'class-validator';
import { clone, filter } from 'lodash';
import { Component, OnInit } from '@angular/core';
import { EntityService } from './../entity.service';
import { ActivatedRoute, Router } from '@angular/router';
import { from, Observable } from 'rxjs';
import { IClassRef, IEntityRef, IPropertyRef, IValidatorEntry, METATYPE_PROPERTY, Validator } from '@allgemein/schema-api';
import { isEntityRef } from '@allgemein/schema-api/api/IEntityRef';


@Component({
  selector: 'entity-struct',
  templateUrl: './entity-struct.component.html',
  styleUrls: ['./entity-struct.component.scss']
})
export class EntityStructComponent implements OnInit {

  _name: Observable<string>;

  name: string;

  entityRef: IEntityRef;

  referrerProps: IPropertyRef[] = [];

  propertyRefs: { ref: IPropertyRef; level: number }[] = [];

  validationEntries: IValidatorEntry[] = [];

  constructor(
    public service: EntityService,
    private route: ActivatedRoute,
    private router: Router) {

  }

  ngOnInit() {
    this.service.isLoaded().subscribe(x => {
      if (x) {
        this.load();
      }
    });
  }

  load() {
    this.name = this.route.snapshot.paramMap.get('name');
    // this.id = this.route.snapshot.paramMap.get('id');
    this.referrerProps = [];
    this.propertyRefs = [];

    // this.name = name;
    this.entityRef = this.service.getEntityRefForName(this.name);
    if (!this.entityRef) {
      throw new Error('Entity reference not loaded or not exists.');
    }
    this.referrerProps = [].concat(...this.service.getRegistries().map(reg => reg.filter(METATYPE_PROPERTY,
      (referrer: IPropertyRef) => referrer.isReference() && referrer.getTargetRef() === this.entityRef.getClassRef())));
    this.scan(this.entityRef);
    from(Validator.getValidationEntries(this.entityRef)).subscribe((x: IValidatorEntry[]) => {
      this.validationEntries = x;
    });
  }


  type(propertyDef: IPropertyRef): string {
    if (propertyDef.isReference() && propertyDef.getTargetRef().hasEntityRef()) {
      return propertyDef.getTargetRef().name;
    } else {
      return propertyDef.getOptions('type');
    }
  }


  scan(source: IClassRef | IEntityRef, level: number = 0) {
    if (level > 1) {
      return;
    }
    if (source) {
      for (const props of source.getPropertyRefs()) {
        this.propertyRefs.push({ ref: props, level: level });
        if (props.isReference()) {
          this.scan(props.getTargetRef(), level + 1);
        }
      }
    }
  }

  // validator(property: PropertyRef) {
  //   const validators = getMetadataStorage().getTargetValidationMetadatas(this.entityRef.getClass(), null, true, false);
  //   return filter(validators, v => v.propertyName === property.name);
  // }

  async validator(property: IPropertyRef) {
    return filter(this.validationEntries, v => v.property === property.name);
  }

  cardinality(propDef: IPropertyRef) {
    return propDef.isCollection() ? 0 : 1;
  }

  options(propDef: IPropertyRef) {
    const opts = clone(propDef.getOptions());
    if (opts.target) {
      delete opts.target;
    }
    if (isEntityRef(opts.type)) {
      opts.type = opts.type.name;
    }
    return opts;
  }

  //
  // async validator(property: IPropertyRef) {
  //   return filter(this.validationEntries, v => v.property === property.name);
  // }

}
