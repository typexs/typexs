import {Component, OnInit} from '@angular/core';
import {EntityService} from './../entity.service';
import {ActivatedRoute} from '@angular/router';
import {IEntityRef} from '@allgemein/schema-api';

@Component({
  selector: 'txs-entity-view',
  templateUrl: './entity-view.component.html'
})
export class EntityViewComponent implements OnInit {

  ready: boolean = false;

  name: string;

  id: string;

  entityDef: IEntityRef;

  instance: any;

  error: any = null;

  constructor(public entityService: EntityService, private route: ActivatedRoute) {
  }


  ngOnInit() {
    this.entityService.isLoaded().subscribe(x => {
      this.load();
    });
  }


  load() {
    this.name = this.route.snapshot.paramMap.get('name');
    this.id = this.route.snapshot.paramMap.get('id');
    this.entityDef = this.entityService.getEntityRefForName(this.name);
    if (this.entityDef) {
      this.entityService.get(this.name, this.id).subscribe((entity: any) => {
        this.instance = entity;
        this.ready = true;
      });
    } else {
      this.error = `Can't find entity type for ${this.name}.`;
    }
  }


}
