// import {getMetadataStorage} from 'class-validator';
import {clone} from 'lodash';
import {Component, OnInit} from '@angular/core';
import {EntityService} from './../entity.service';
import {ActivatedRoute, Router} from '@angular/router';
import {Observable} from 'rxjs';
import {IClassRef, IEntityRef, IPropertyRef, METATYPE_PROPERTY} from '@allgemein/schema-api';


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

  propertyDefs: { property: IPropertyRef, level: number }[] = [];


  constructor(public entityService: EntityService,
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
    this.referrerProps = this.entityDef.getRegistry().filter(METATYPE_PROPERTY, (referrer: IPropertyRef) => {
      return referrer.isReference() && referrer.getTargetRef() === this.entityDef.getClassRef();
    });
    this.scan(this.entityDef);
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
      this.propertyDefs.push({property: props, level: level});
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

}
