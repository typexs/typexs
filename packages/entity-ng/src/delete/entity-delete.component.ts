import {Component, OnInit} from '@angular/core';
import {EntityService} from './../entity.service';
import {ActivatedRoute, Router} from '@angular/router';
import {EntityRegistry} from '@typexs/schema/libs/EntityRegistry';
import {EntityRef} from '@typexs/schema/libs/registry/EntityRef';

@Component({
  selector: 'entity-delete',
  templateUrl: './entity-delete.component.html'
})
export class EntityDeleteComponent implements OnInit {

  ready = false;

  name: string;

  id: string;

  entityDef: EntityRef;

  instance: any;

  error: any = null;

  deleted = false;

  constructor(public entityService: EntityService,
              private route: ActivatedRoute,
              private router: Router) {
  }


  ngOnInit() {
    this.entityService.isReady(() => {
      this.load();
    });
  }


  load() {
    this.name = this.route.snapshot.paramMap.get('name');
    this.id = this.route.snapshot.paramMap.get('id');
    this.entityDef = EntityRegistry.$().getEntityRefByName(this.name);
    if (this.entityDef) {
      this.entityService.get(this.name, this.id).subscribe((entity) => {
        this.instance = entity;
      });
    } else {
      this.error = `Can't find entity type for ${this.name}.`;
    }
    this.ready = true;
  }


  doDelete() {
    if (!this.error) {
      if (this.entityDef && this.instance) {
        this.entityService.delete(this.name, this.id).subscribe(async (entity) => {
          // TODO maybe wait
          this.instance = entity;
          this.deleted = true;
//          await this.router.navigate([storageService.getNgUrlPrefix(), this.name, 'query']);
        });
      }
    }
  }

  doAbort() {
    return this.router.navigate([this.entityService.getNgUrlPrefix(), this.name, 'view', this.id]);
  }

  gotoQuery() {
    return this.router.navigate([this.entityService.getNgUrlPrefix(), this.name, 'query']);
  }

}
