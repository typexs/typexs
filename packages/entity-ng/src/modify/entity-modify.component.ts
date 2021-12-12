import { Component, OnInit } from '@angular/core';
import { EntityService } from './../entity.service';
import { ActivatedRoute, Router } from '@angular/router';
import { IEntityRef } from '@allgemein/schema-api';
import { Expressions } from '@allgemein/expressions';
import { LabelHelper } from '@typexs/base/libs/utils/LabelHelper';

@Component({
  selector: 'entity-modify',
  templateUrl: './entity-modify.component.html'
})
export class EntityModifyComponent implements OnInit {

  ready = false;

  new = true;

  id: any;

  name: string;

  entityDef: IEntityRef;

  instance: any;

  error: any = null;

  constructor(
    private entityService: EntityService,
    private route: ActivatedRoute,
    private router: Router) {
  }


  ngOnInit() {
    this.entityService.isLoaded().subscribe(x => {
      this.load();
    });
  }


  getRegistry() {
    return this.entityService.getRegistry();
  }

  getNgUrlPrefix() {
    return this.entityService.getNgUrlPrefix();
  }

  load() {
    this.name = this.route.snapshot.paramMap.get('name');
    this.id = this.route.snapshot.paramMap.get('id');
    this.entityDef = this.getRegistry().getEntityRefFor(this.name);
    if (this.entityDef) {
      if (this.id) {
        this.new = false;
        this.entityService.get(this.name, this.id).subscribe((entity: any) => {
          if (entity) {
            this.instance = entity;
          }

        });
      } else {
        this.new = true;
        this.instance = this.entityDef.create();
      }

    } else {
      this.error = `Can't find entity type for ${this.name}.`;
    }
    this.ready = true;
  }


  buildLookupConditions(data: any | any[]) {
    return Expressions.buildLookupConditions(this.entityDef, data);
  }


  createLookupConditions(id: string): any | any[] {
    return Expressions.parseLookupConditions(this.entityDef, id);
  }


  label(entity: any, sep: string = ' ', max: number = 1024): string {
    return LabelHelper.labelForEntity(entity, this.entityDef, sep, max);
  }


  onSubmit($event: any) {
    if ($event.data.isValidated && $event.data.isSuccessValidated) {
      const instance = $event.data.instance;
      if (this.new) {
        this.entityService.save(this.name, instance).subscribe(async (res: any) => {
          if (res) {
            const idStr = this.buildLookupConditions(res);
            // TODO flash message
            await this.router.navigate([this.entityService.getNgUrlPrefix(), this.name, 'view', idStr]);
          } else {
            // TODO error?
          }
        });
      } else {
        this.entityService.update(this.name, this.id, instance).subscribe(async (res: any) => {
          if (res) {
            const idStr = this.buildLookupConditions(res);
            // TODO flash message
            await this.router.navigate([this.entityService.getNgUrlPrefix(), this.name, 'view', idStr]);
          } else {
            // TODO error?
          }
        });

      }
    }

  }
}
