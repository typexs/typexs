import { assign, isArray, uniq } from 'lodash';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { IEntityRef } from '@allgemein/schema-api';
import { EntityResolverService } from '../../../services/entity-resolver.service';
import { C_FLEXIBLE, LabelHelper } from '@typexs/base';
import { IViewOptions } from '../../view/IViewOptions';
import { IEntityResolveOptions } from '../../../services/IEntityResolveOptions';


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

  viewOptions: IViewOptions = { elem: { reload: true }, allowViewModeSwitch: true };

  resolverOptions: IEntityResolveOptions = {};

  constructor(
    private route: ActivatedRoute,
    private resolver: EntityResolverService) {
  }


  label(): string {
    if (this.instance) {
      return this.resolver.getLabelFor(this.instance, this.resolverOptions);
    }
    return undefined;
  }


  ngOnInit() {
    this.resolver.isLoaded().subscribe(x => {
      if (isArray(x)) {
        const f = uniq(x);
        if (f.length > 0 && f[0]) {
          this.route.paramMap.subscribe(this.onRouteChange.bind(this));
        }
      }
    });
  }


  onRouteChange(x: ParamMap) {
    const name = x.get('name');
    const id = x.get('id');

    if (this.name !== name || this.id !== id) {
      let query = {};
      try {
        query = this.route.snapshot.queryParamMap.get('opts');
      } catch (e) {
        query = {};
      }
      this.load(name, id, query);
    }
  }


  load(name: string, id: string, queryMap: any) {
    this.name = name;
    this.id = id;

    const opts = {};
    this.entityRef = this.resolver.getEntityRef(this.name, this.resolverOptions);
    if (!this.entityRef) {
      throw new Error('Entity reference not found.');
    }
    const dynamic = this.entityRef.getOptions(C_FLEXIBLE);
    if (dynamic === true) {
      opts['raw'] = true;
    }

    try {
      const _opts = JSON.parse(queryMap);
      assign(opts, _opts);
    } catch (e) {
    }

    const service = this.resolver.getServiceForEntity(this.entityRef);
    service.get(this.name, this.id, opts).subscribe((x: any) => {
      this.instance = x;
      this.ready = true;
    }, () => {
      this.error = `Can't find entity type for ${this.name}.`;
    });

  }


}
