import {
  defaults, find, isArray, isEmpty, isFunction, isNumber, intersection,
  get, clone, upperFirst, isNull, keys, values, isString, filter, merge, isPlainObject,
  concat, kebabCase, has, snakeCase, isRegExp, orderBy, remove, first, set, assign,
  capitalize, isUndefined
} from 'lodash';
import {Component, HostBinding, Input} from '@angular/core';



import {SystemNodeInfo} from '@typexs/base/entities/SystemNodeInfo';
import {INodeInfo} from '@typexs/base/libs/system/INodeInfo';


@Component({
  selector: 'system-node-info',
  templateUrl: './system-node-info.component.html'
})
export class SystemNodeInfoComponent {


  collapsed = true;

  @Input()
  type: 'row' = 'row';

  @Input()
  node: SystemNodeInfo;


  selectContext(node: SystemNodeInfo, type: 'tasks' | 'workers'): any[] {
    const x = find(node.contexts, (y: INodeInfo) => y.context === type);
    if (!x) {
      return [];
    }
    return x[type];
  }

  toggle() {
    this.collapsed = !this.collapsed;
  }

}
