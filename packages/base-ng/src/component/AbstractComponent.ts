import { filter, find, first, isArray, isEmpty, isFunction, keys, remove } from 'lodash';
import { Component, ComponentFactoryResolver, ComponentRef, Inject, Injector, Type, ViewChild, ViewContainerRef } from '@angular/core';
import { ComponentRegistryService } from './component-registry.service';
import { Log } from '../lib/log/Log';
import { NotYetImplementedError } from '@allgemein/base';
import { ClassType } from '@allgemein/schema-api';
import { IInstanceableComponent } from './IInstanceableComponent';
import { C_DEFAULT, C_ID, M_getViewContext, M_setViewContext, PROP_METADATA } from '../constants';
import { Context, isTreeObject, TreeObject } from '@typexs/ng';


let INC = 0;


@Component({
  // selector: 'txs-abstract-component',
  template: ''
})
export class AbstractComponent<T> implements IInstanceableComponent<T> {

  inputKeys: string[] = [];

  context: Context;

  _instance: T;

  @ViewChild('content', { read: ViewContainerRef, static: true })
  vc: ViewContainerRef;

  _created = false;

  _components: ComponentRef<any>[] = [];

  constructor(@Inject(Injector) public injector: Injector,
    @Inject(ComponentFactoryResolver) public r: ComponentFactoryResolver) {
    this.construct();
  }

  construct() {
  }


  getInstance(): T {
    return this._instance;
  }

  setInstance(instance: T) {
    this._instance = instance;
  }

  getViewContainerRef(): ViewContainerRef {
    return this.vc;
  }

  getComponentRegistry(): ComponentRegistryService {
    return this.injector.get(ComponentRegistryService);
  }

  isCreated() {
    return this._created;
  }

  buildComponentForObject(content: any) {
    const context = this[M_getViewContext] ? this[M_getViewContext]() : C_DEFAULT;
    const obj = this.getComponentRegistry().getComponentForObject(content, context);
    if (obj && obj.component) {
      return this.buildComponent(obj.component as any, content);
    }
    return null;
  }

  buildSelf(content: any): IInstanceableComponent<any> {
    if (content) {
      if (isTreeObject(content)) {
        const handle = this.getComponentRegistry().getDef(content.getType(), true);
        if (handle && handle.component) {
          return this.buildComponent(handle.component as any, content);
        }
      } else {
        return this.buildComponentForObject(content);
      }
    }
    return null;
  }

  /**
   * Dynamically create a component view
   * @param cmptType
   */
  createComponentView<T>(cmptType: Type<T>) {
    const factory = this.r.resolveComponentFactory(cmptType);
    const ref = this.getViewContainerRef().createComponent(factory);
    const ID = INC++;
    Object.defineProperty(ref, C_ID, { value: ID, enumerable: true });
    this._components.push(ref);
    ref.onDestroy(() => remove(this._components, r => r[C_ID] === ID));
    return ref;
  }


  buildComponent(component: ClassType<IInstanceableComponent<T>>, content: any) {
    if (this.getViewContainerRef()) {
      const compRef = this.createComponentView(component);
      const instance = <IInstanceableComponent<T>>compRef.instance;
      let metadata: { [k: string]: any } = null;
      // eslint-disable-next-line no-prototype-builtins
      if (instance.constructor.hasOwnProperty(PROP_METADATA)) {
        metadata = instance.constructor[PROP_METADATA];
      }
      instance.setInstance(content);
      this._created = true;

      // // pass changing options
      // if (this['setOptions'] && instance.getOptions) {
      //   const fn = this['setOptions'].bind(this);
      //   this['setOptions'] = (opts: any) => {
      //     fn(opts);
      //     instance.setOptions(opts);
      //   };
      //   // pass data
      //   if (this['getOptions']) {
      //     instance.setOptions(this['getOptions']());
      //   }
      // }

      // pass changing context
      if (this[M_setViewContext] && instance.setViewContext) {
        const fn = this[M_setViewContext].bind(this);
        this[M_setViewContext] = (context: string) => {
          fn(context);
          instance.setViewContext(context);
        };
        // pass data
        if (this[M_getViewContext]) {
          instance.setViewContext(this[M_getViewContext]());
        }
      }

      // passing through input parameters
      for (const prop of this.inputKeys) {
        // instance[prop] = this[prop];
        try {
          const propDesc = Object.getOwnPropertyDescriptor(this, prop);
          if (propDesc) {
            // copy only if exists
            Object.defineProperty(instance, prop, propDesc);
          }
        } catch (e) {
        }
      }

      if (instance instanceof AbstractComponent && instance.build) {
        const refs = instance.build(content);

        if (metadata) {
          for (const key of keys(metadata)) {
            const v = metadata[key];
            if (!isEmpty(v)) {

              if (isArray(v) && v.length === 1) {
                const propDecorator = first(v);
                if (isFunction(propDecorator.selector)) {
                  if (propDecorator.first) {
                    // simple ViewChild
                    instance[key] = find(refs, ref => ref.constructor === propDecorator.selector);
                    instance[key + '2'] = find(refs, ref => ref.constructor === propDecorator.selector);
                  } else {
                    // simple ViewChildren
                    instance[key] = filter(refs, ref => ref.constructor === propDecorator.selector);
                    instance[key + '2'] = filter(refs, ref => ref.constructor === propDecorator.selector);
                  }
                }
              }
            }
          }
        }
      }
      return instance;
    } else {
      Log.error('No view content setted');
      return null;
    }
  }


  build(content: T): IInstanceableComponent<T>[] {
    const refs: IInstanceableComponent<T>[] = [];
    if (content instanceof TreeObject) {
      content.getChildren().forEach(contentObject => {
        const ref = this.buildSelf(contentObject as any);
        refs.push(ref);
      });
    } else {
      throw new NotYetImplementedError();
    }
    return refs;
  }


  reset() {
    if (this.getViewContainerRef()) {
      this.getViewContainerRef().clear();
    }
  }

}
