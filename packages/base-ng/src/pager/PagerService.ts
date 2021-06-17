import {find, remove} from 'lodash';
import {Injectable} from '@angular/core';
import {Pager} from './Pager';
import {ActivatedRoute, Router} from '@angular/router';


@Injectable()
export class PagerService {

  pagers: Pager[] = [];

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {
  }

  find(id: string) {
    return find(this.pagers, p => p.name === id);
  }

  get(id: string) {
    let pager = this.find(id);
    if (!pager) {
      pager = new Pager(this.router, this.activatedRoute, id);
      this.pagers.push(pager);
    }
    pager.inc();
    return pager;
  }

  create() {
    const pager = new Pager(this.router, this.activatedRoute);
    this.pagers.push(pager);
    pager.inc();
    return pager;
  }

  remove(id: string) {
    const pager = this.find(id);
    if (pager) {
      pager.dec();
      if (pager.free()) {
        remove(this.pagers, p => p.name === id);
      }
    }
  }

}
