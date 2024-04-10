import { remove } from 'lodash';
import { Injectable } from '@angular/core';
import { Pager } from './Pager';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';


@Injectable()
export class PagerService {

  pagers: Pager[] = [];

  constructor(
    private location: Location,
    private router: Router,
    private activatedRoute: ActivatedRoute) {
  }

  find(id: string) {
    return this.pagers.find(p => p.name === id);
  }

  get(id: string) {
    let pager = this.find(id);
    if (!pager) {
      pager = this.create(id);
    }
    return pager;
  }

  create(id: string = 'page') {
    const pager = new Pager(this.location, this.router, this.activatedRoute, id);
    this.pagers.push(pager);
    pager.inc();
    return pager;
  }

  remove(id: string) {
    const pager = this.find(id);
    if (pager) {
      pager.dec();
      if (pager.canBeFreed()) {
        pager.free();
        remove(this.pagers, p => p.name === id);
      }
    }
  }

}
