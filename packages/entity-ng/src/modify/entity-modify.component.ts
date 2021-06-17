import {Component, OnInit} from '@angular/core';
import {EntityService} from './../entity.service';
import {ActivatedRoute, Router} from '@angular/router';
import {EntityRegistry} from '@typexs/schema/libs/EntityRegistry';
import {EntityRef} from '@typexs/schema/libs/registry/EntityRef';

@Component({
  selector: 'entity-modify',
  templateUrl: './entity-modify.component.html'
})
export class EntityModifyComponent implements OnInit {

  ready = false;

  new = true;

  id: any;

  name: string;

  entityDef: EntityRef;

  instance: any;

  error: any = null;

  constructor(private entityService: EntityService,
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
    this.entityDef = EntityRegistry.$().getEntityRefByName(this.name);
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


  onSubmit($event: any) {
    if ($event.data.isValidated && $event.data.isSuccessValidated) {
      const instance = $event.data.instance;
      if (this.new) {
        this.entityService.save(this.name, instance).subscribe(async (res: any) => {
          if (res) {
            const idStr = this.entityDef.buildLookupConditions(res);
            // TODO flash message
            await this.router.navigate([this.entityService.getNgUrlPrefix(), this.name, 'view', idStr]);
          } else {
            // TODO error?
          }
        });
      } else {
        this.entityService.update(this.name, this.id, instance).subscribe(async (res: any) => {
          if (res) {
            const idStr = this.entityDef.buildLookupConditions(res);
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
