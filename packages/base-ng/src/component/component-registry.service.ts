import { first } from 'lodash';
import { Inject, Injectable } from '@angular/core';
import { C_DEFAULT } from '../constants';
import { ObjectToComponentResolver } from './ObjectToComponentResolver';
import { ComponentRegistry, IComponentBinding, IExtraBindingInfo } from '@typexs/base';
import { ClassType } from '../datatable/Constants';

@Injectable()
export class ComponentRegistryService {

  registry: ComponentRegistry = ComponentRegistry.$();

  components: { [name: string]: Function } = {};


  constructor(@Inject(ObjectToComponentResolver) private resolver: ObjectToComponentResolver) {
  }

  getOrCreateDef(typeName: string | string[], normalize: boolean = false): IComponentBinding {
    return this.registry.getOrCreateDef(typeName, normalize);
  }

  getDef(typeName: string | string[], normalize: boolean = false): IComponentBinding {
    return this.registry.getDef(typeName, normalize);
  }

  /**
   * Return the component registry
   */
  getRegistry() {
    return this.registry;
  }


  getComponentForObject(obj: any, context: string = C_DEFAULT) {
    if (this.resolver) {
      const found = this.resolver.resolve(obj, context);
      if (found) {
        return found;
      }
    }
    const list = this.registry.forInstance(obj);
    if (list.length === 0) {
      return null;
    }
    // return look for special mode context
    const found = list.find(x => x.extra.context === context);
    if (found) {
      return found;
    }
    // return default
    const defaultFound = list.find(x => x.extra.context === C_DEFAULT);
    if (defaultFound) {
      return defaultFound;
    }
    return first(list);
  }


  getComponentClass(...args: string[]) {
    return this.registry.getComponentClass(args);
  }


  setComponentClass(name: string | string[], fn: Function, extra: IExtraBindingInfo = null) {
    return this.registry.setComponentClass(name, fn, extra);
  }

  setComponentForClass(comp: Function, handle: Function | string | RegExp, extra: IExtraBindingInfo = null) {
    return this.registry.setComponentForClass(comp, handle, extra);
  }

  remove(filter: (x: IComponentBinding) => boolean) {
    this.registry.remove(filter);
  }

}
