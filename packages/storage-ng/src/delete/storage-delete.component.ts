import { snakeCase } from 'lodash';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StorageService } from '../storage.service';
import { IEntityRef, METATYPE_ENTITY } from '@allgemein/schema-api';


@Component({
  selector: 'txs-storage-delete',
  templateUrl: './storage-delete.component.html'
})
export class StorageDeleteComponent implements OnInit {

  ready: boolean = false;

  name: string;

  id: string;

  entityDef: IEntityRef;

  instance: any;

  error: any = null;

  deleted: boolean = false;

  constructor(public entityService: StorageService,
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
    this.entityDef = this.entityService.getRegistry().find(METATYPE_ENTITY, (e: IEntityRef) => e.machineName === snakeCase(this.name));
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
