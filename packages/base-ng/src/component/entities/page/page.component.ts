import { assign, isArray, uniq } from 'lodash';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IEntityRef } from '@allgemein/schema-api';
import { EntityResolverService } from '../../../services/entity-resolver.service';
import { C_FLEXIBLE, LabelHelper } from '@typexs/base';


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

  constructor(
    private route: ActivatedRoute,
    private resolver: EntityResolverService) {
  }

  label(): string {
    if (this.instance) {
      return LabelHelper.labelForEntity(this.instance, this.entityRef);
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
    const dynamic = this.entityRef.getOptions(C_FLEXIBLE);
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
    }, () => {
      this.error = `Can't find entity type for ${this.name}.`;
    });

  }


}
