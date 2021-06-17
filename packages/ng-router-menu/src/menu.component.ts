import {defaults, isNull} from 'lodash';
import {Component, Input, OnInit} from '@angular/core';
import {NavigatorService} from './navigator.service';
import {INavTreeEntry} from './INavTreeEntry';
import {NavEntry} from './NavEntry';
import {IMenuOptions} from './IMenuOptions';

export const DEFAULT_OPTIONS: IMenuOptions = {
  label: null,
  base: null,
  group: null,
  level: null,
  regex: null,
  filter: (options: IMenuOptions, e: NavEntry) => {
    let ret = true;
    if (!isNull(options.group)) {
      ret = ret && e.groups && e.groups.indexOf(options.group) !== -1;
    }
    if (!isNull(options.level)) {
      ret = ret && e.getLevel() <= options.level;
    }
    if (!isNull(options.regex)) {
      let regex: RegExp = options.regex as any;
      if (!(options.regex instanceof RegExp)) {
        regex = new RegExp(regex);
      }
      ret = ret && regex.test(e.getFullPath());
    }
    return ret;
  }
};


@Component({
  selector: 'menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
})
export class MenuComponent implements OnInit {

  @Input()
  options: IMenuOptions = DEFAULT_OPTIONS;

  tree: INavTreeEntry[] = [];

  constructor(private navigator: NavigatorService) {
  }

  ngOnInit() {
    this.options = defaults(this.options, DEFAULT_OPTIONS);
    this.tree = this.navigator.getTree(
      this.options.base, this.options.filter ?
        this.options.filter.bind(this, this.options) : null);
  }

}
