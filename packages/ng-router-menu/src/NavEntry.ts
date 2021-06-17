import {assign, capitalize, get, has, isArray, isEmpty, last} from 'lodash';
import {Route} from '@angular/router';
import {hasComponent, isLazyLoading, isRedirect} from './lib/Helper';

export class NavEntry {

  static inc = 0;

  readonly id: number = 0;

  ignore = false;

  private fixedPath = false;

  private orgPath: string = null;

  data: any = {};

  path: string;

  route: Route;

  paths: string[] = [];

  label?: string;

  parent: NavEntry = null;

  params?: any = {};

  groupType?: 'pattern' | 'route';

  groups?: string[];

  groupRegex?: string;

  outlet?: string;


  constructor() {
    this.id = NavEntry.inc++;
  }


  parse(route: Route) {
    this.route = route;
    // save original path
    this.orgPath = this.route.path;
    route['navId'] = this.id;
    this.path = route.path;
    this.paths = this.path.split('/');
    const fixedPath = [];

    for (let i = 0; i < this.paths.length; i++) {
      const entry = this.paths[i];
      if (entry.startsWith(':')) {
        // is placeholder
        this.params[entry.replace(/^:/, '')] = i;
      } else {
        fixedPath.push(entry);
      }
    }

    if (route.outlet) {
      this.outlet = route.outlet;
    }

    this.parseData(route.data);

    if (!this.label) {
      this.label = !isEmpty(fixedPath) ? capitalize(last(fixedPath)) : 'Undefined';
    }

    if (!hasComponent(route) && !isRedirect(route)) {
      // is group
      this.groupType = 'route';
      this.groupRegex = this.path.replace('/', '\\/');
    }


    // TODO has path parent
    // TODO has path placeholder
    // TODO has level
  }

  parseData(data: any) {
    if (data) {
      if (has(data, 'label')) {
        this.label = data.label;
      }
      if (has(data, 'group') || has(data, 'groups')) {
        const groups = get(data, 'group', get(data, 'groups'));
        this.groups = isArray(groups) ? groups : [groups];
      }
      if (has(data, 'skip')) {
        this.ignore = data.skip;
      }

      this.data = data;
    }
  }


  merge(route: Route) {
    if (isLazyLoading(route)) {
      this.route = assign(this.route, route);
      route['navId'] = this.id;
    }
  }

  getCanActivate() {
    if (has(this.route, 'canActivate')) {
      return this.route.canActivate;
    }
    return false;
  }


  asGroup(pattern: any, data: any) {
    this.route = {
      data: data ? data : {}
    };
    this.groupType = 'pattern';
    this.parseData(data);
    this.groupRegex = pattern;
    if (has(data, 'canActivate')) {
      this.route.canActivate = data.canActivate;
    }
  }

  getPermissions() {
    if (has(this.route, 'data.permissions')) {
      return get(this.route, 'data.permissions', []);
    }
    return null;
  }

  isGroup(type?: 'route' | 'pattern') {
    if (type) {
      return !!this.groupType && type === this.groupType;
    }
    return !!this.groupType;
  }

  hasRoute() {
    return !!this.route;
  }

  markAsFixedPath() {
    this.fixedPath = true;
  }

  setParent(route: NavEntry) {
    if (this.parent !== route && this !== route) {
      const localPath = this.getFullPath();
      this.parent = route;
      if (!this.fixedPath) {
        const parentPath = this.parent.getFullPath();
        if (localPath && localPath.startsWith(parentPath + '/')) {
          this.path = localPath.replace(parentPath + '/', '');
        }
      }
    }
  }

  getPath() {
    return this.path;
  }

  getLevel(): number {
    if (this.parent) {
      return this.parent.getLevel() + 1;
    }
    return 0;
  }

  getParentId() {
    if (this.parent) {
      return this.parent.id;
    }
    return -1;
  }

  getComponentName() {
    if (this.route && this.route.component) {
      return this.route.component.name;
    }
    return null;
  }


  getFullPath(): string {
    if (this.fixedPath) {
      return this.path;
    }
    const path = [];
    if (this.parent) {
      path.push(this.parent.getFullPath());
    }
    if (this.path) {
      path.push(this.path);
    }
    return path.filter(x => !isEmpty(x)).join('/');
  }


  isRedirect() {
    if (this.route && this.route.redirectTo) {
      return true;
    }
    return false;
  }


  isLazyLoading() {
    if (this.route && (this.route.loadChildren || has(this.route, '_loadedConfig'))) {
      return true;
    }
    return false;
  }


  isLazyLoaded() {
    return this.isLazyLoading() && has(this.route, '_loadedConfig.routes');
  }

  toIgnore() {
    return this.ignore;
  }

  getParentPath(): string {
    const path = this.getFullPath();
    const f = path.split('/');
    f.pop();
    return f.join('/');
  }

  getNearestRoute(): Route {
    if (this.route) {
      return this.route;
    } else if (this.parent) {
      return this.parent.getNearestRoute();
    }
    return null;
  }

  getNearestPath(): string {
    if (this.path) {
      return this.path;
    } else if (this.parent) {
      return this.parent.getNearestPath();
    }
    return null;
  }

}
