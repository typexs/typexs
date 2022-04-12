import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StorageService } from '../storage.service';
import { IEntityRef } from '@allgemein/schema-api';
import { IFormOptions, K_HIDDEN } from '@typexs/forms';
import { UrlHelper } from '@typexs/base-ng';

@Component({
  selector: 'storage-modify',
  templateUrl: './storage-modify.component.html'
})
export class StorageModifyComponent implements OnInit {

  ready: boolean = false;

  new: boolean = true;

  id: any;

  name: string;

  entityDef: IEntityRef;

  instance: any;

  error: any = null;

  formOptions: IFormOptions = { onlyDecoratedFields: false, defaultFormType: K_HIDDEN, readonlyIdentifier: false };

  constructor(private storageService: StorageService,
    private route: ActivatedRoute,
    private router: Router) {
  }


  ngOnInit() {
    this.storageService.isLoaded().subscribe(x => {
      this.load();
    });
  }

  getNgUrlPrefix() {
    return this.storageService.getNgUrlPrefix();
  }


  load() {
    this.name = this.route.snapshot.paramMap.get('name');
    this.id = this.route.snapshot.paramMap.get('id');
    this.entityDef = this.storageService.getEntityRefForName(this.name);
    if (this.entityDef) {
      if (this.id) {
        this.new = false;
        this.storageService.get(this.name, this.id).subscribe((entity) => {
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

  getRegistry() {
    return this.entityDef.getRegistry();
  }


  onSubmit($event: any) {
    if ($event.data.isValidated && $event.data.isSuccessValidated) {
      const instance = $event.data.instance;
      if (this.new) {
        this.storageService.save(this.name, instance).subscribe(async (res: any) => {
          if (res) {
            const idStr = UrlHelper.buildLookupConditions(this.entityDef, res);
            // TODO flash message
            await this.router.navigate(
              [this.storageService.getNgUrlPrefix(), this.name, 'view', idStr]);
          } else {
            // TODO error?
          }
        });
      } else {
        this.storageService.update(this.name, this.id, instance).subscribe(async (res: any) => {
          if (res) {
            const idStr = UrlHelper.buildLookupConditions(this.entityDef, res);
            // TODO flash message
            await this.router.navigate(
              [this.storageService.getNgUrlPrefix(), this.name, 'view', idStr]);
          } else {
            // TODO error?
          }
        });

      }
    }

  }
}
