import {assign, isArray, isFunction, uniq} from 'lodash';
import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {IEntityRef} from '@allgemein/schema-api';
import {EntityResolverService} from '../../../services/entity-resolver.service';
import {C_$LABEL, C_LABEL} from '../../../api/querying/Constants';


@Component({
  selector: 'txs-entity-view-page',
  templateUrl: './page.component.html'
})
export class EntityViewPageComponent implements OnInit {

  ready = false;

  name: string;

  id: string;

  entityRef: IEntityRef;

  instance: any;

  error: any = null;

  constructor(private route: ActivatedRoute,
              private resolver: EntityResolverService) {
  }

  label() {
    if (this.instance) {
      if (isFunction(this.instance[C_LABEL])) {
        return this.instance[C_LABEL];
      } else if (this.instance[C_$LABEL]) {
        return this.instance[C_$LABEL];
      }
    }
    return undefined;
  }


  ngOnInit() {
    this.resolver.isLoaded().subscribe(x => {
      if (isArray(x)) {
        const f = uniq(x);
        if (f.length > 0 && f[0]) {
          this.load();
        }
      }

    });
  }


  load() {
    this.name = this.route.snapshot.paramMap.get('name');
    this.id = this.route.snapshot.paramMap.get('id');

    const opts = {};
    this.entityRef = this.resolver.getEntityRef(this.name);
    const dynamic = this.entityRef.getOptions('dynamic');
    if (dynamic === true) {
      opts['raw'] = true;
    }

    try {
      const _opts = JSON.parse(this.route.snapshot.queryParamMap.get('opts'));
      assign(opts, _opts);
    } catch (e) {
    }

    const service = this.resolver.getServiceForEntity(this.entityRef);
    service.get(this.name, this.id, opts).subscribe(x => {
      this.instance = x;
      this.ready = true;
    }, error1 => {
      this.error = `Can't find entity type for ${this.name}.`;
    });


    // this.entityDef = this.entityService.getRegistry().getEntityRefFor(this.name);
    // if (this.entityDef) {
    //   this.entityService.get(this.name, this.id).subscribe((entity: any) => {
    //     this.instance = entity;
    //     this.ready = true;
    //   });
    // } else {
    //   this.error = `Can't find entity type for ${this.name}.`;
    // }

  }


}
