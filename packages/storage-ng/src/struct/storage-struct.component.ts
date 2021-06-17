import {clone, filter} from 'lodash';
import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {IClassRef, IEntityRef, IPropertyRef, IValidatorEntry, METATYPE_PROPERTY, Validator} from '@allgemein/schema-api';
import {StorageService} from '../storage.service';
import {from} from 'rxjs';


@Component({
  selector: 'storage-struct',
  templateUrl: './storage-struct.component.html',
  styleUrls: ['./storage-struct.component.scss']
})
export class StorageStructComponent implements OnInit {

  name: string;

  entityRef: IEntityRef;

  referrerProps: IPropertyRef[] = [];

  propertyRefs: { ref: IPropertyRef, level: number }[] = [];

  validationEntries: IValidatorEntry[] = [];

  constructor(public storageService: StorageService,
              private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.storageService.isReady(() => {
      this.route.params.subscribe((params => {
        if (params.name) {
          this.load(params.name);
        }
      }));
    });
  }


  load(name: string) {
    this.referrerProps = [];
    this.propertyRefs = [];
    this.name = name;
    this.entityRef = this.getRegistry().getEntityRefFor(this.name);
    this.referrerProps = this.getRegistry().filter(METATYPE_PROPERTY, (referrer: IPropertyRef) => {
      return referrer.isReference() && referrer.getTargetRef() === this.entityRef.getClassRef();
    });
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

  getRegistry() {
    return this.storageService.getRegistry();
  }


  scan(source: IClassRef | IEntityRef, level: number = 0) {
    if (level > 8) {
      return;
    }
    if (source) {
      for (const props of source.getPropertyRefs()) {
        this.propertyRefs.push({ref: props, level: level});
        if (props.isReference()) {
          this.scan(props.getTargetRef(), level + 1);
        }
      }
    }
  }

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
    return opts;
  }

}
