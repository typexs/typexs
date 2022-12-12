import { filter, find, first, isArray, isEmpty, isFunction, keys, remove } from 'lodash';
import { Component, ComponentRef, Type } from '@angular/core';
import { Log } from '../lib/log/Log';
import { t } from '../lib/i18n/t';
import { NotYetImplementedError } from '@allgemein/base';
import { ClassType } from '@allgemein/schema-api';
import { IInstanceableComponent } from './IInstanceableComponent';
import { C_DEFAULT, C_ID, MTHD_getViewContext, MTHD_setViewContext, PROP_METADATA } from '../constants';
import { Context, isTreeObject, TreeObject } from '@typexs/base';
import { AbstractComponent } from './abstract.component';

let INC = 0;

@Component({
  template: ''
})
export class AbstractInstancableComponent<T> extends AbstractComponent implements IInstanceableComponent<T> {

  inputKeys: string[] = [];

  context: Context;

  _instance: T;

  _created = false;

  _components: ComponentRef<any>[] = [];


  getInstance(): T {
    return this._instance;
  }

  setInstance(instance: T) {
    this._instance = instance;
  }

  isCreated() {
    return this._created;
  }

  /**
   * Build component for passed object by given context mostly "default",
   * when implementing class has method "getViewContext" the given context will be
   * used to find the appropriate component.
   *
   * @param content
   * @param context = C_DEFAULT
   */
  buildComponentForObject(content: any, context: string = C_DEFAULT) {
    context = this[MTHD_getViewContext] ? this[MTHD_getViewContext]() : content;
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
      if (this[MTHD_setViewContext] && instance.setViewContext) {
        const fn = this[MTHD_setViewContext].bind(this);
        this[MTHD_setViewContext] = (context: string) => {
          fn(context);
          instance.setViewContext(context);
        };
        // pass data
        if (this[MTHD_getViewContext]) {
          instance.setViewContext(this[MTHD_getViewContext]());
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

      if (instance instanceof AbstractInstancableComponent && instance.build) {
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
      // call oninit if exists
      compRef.changeDetectorRef.detectChanges();
      return instance;
    } else {
      Log.error(t('No view content setted'));
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


}
