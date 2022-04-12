import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { StorageService } from '../storage.service';
import { IEntityRef } from '@allgemein/schema-api';
import { IViewOptions } from '@typexs/base-ng';

@Component({
  selector: 'storage-view',
  templateUrl: './storage-view.component.html'
})
export class StorageViewComponent implements OnInit {

  ready = false;

  name: string;

  id: string;

  entityDef: IEntityRef;

  instance: any;

  error: any = null;

  viewOptions: IViewOptions = { elem: { reload: true } };

  constructor(public service: StorageService, private route: ActivatedRoute) {
  }


  ngOnInit() {
    this.service.isLoaded().subscribe(x => {
      this.load();
    });
  }


  load() {
    this.name = this.route.snapshot.paramMap.get('name');
    this.id = this.route.snapshot.paramMap.get('id');
    this.entityDef = this.service.getEntityRefForName(this.name);
    if (this.entityDef) {
      this.service.get(this.name, this.id).subscribe((entity: any) => {
        this.instance = entity;
        this.ready = true;
      });
    } else {
      this.error = `Can't find entity type for ${this.name}.`;
    }
  }


}
