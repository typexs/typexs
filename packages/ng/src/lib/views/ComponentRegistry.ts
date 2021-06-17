import {get, has, isArray, isFunction, isRegExp, isString, merge, orderBy, remove, snakeCase} from 'lodash';
import {IBindingInfo, IComponentBinding} from './IComponentBinding';
import {ClassUtils} from '@allgemein/base';
import {__CLASS__} from '@allgemein/schema-api';
import {NoFormHandlerDefinedForTypeError} from '../exceptions/NoFormHandlerDefinedForTypeError';
import {C_DEFAULT} from '../Constants';

export class ComponentRegistry {

  private constructor() {
  }

  private static $self: ComponentRegistry = null;

  private handler: IComponentBinding[] = [];

  static $(): ComponentRegistry {
    if (!this.$self) {
      this.$self = new ComponentRegistry();
    }
    return this.$self;
  }

  static addHandle(typeName: string, handle: Function): IComponentBinding {
    const res = this.$().addHandle(typeName, handle);
    return res;
  }

  static addComponent(typeName: string, comp: Function): IComponentBinding {
    const res = this.$().addComponent(typeName, comp);
    return res;
  }

  static createHandle<T>(typeName: string): T {
    const res = this.$().createHandle<T>(typeName);
    return res;
  }

  static createComponent<T>(typeName: string): T {
    const res = this.$().createComponent<T>(typeName);
    return res;
  }

  static getClassName(obj: any) {
    if (has(obj, __CLASS__)) {
      return obj[__CLASS__];
    }
    return ClassUtils.getClassName(obj);
  }

  addHandle(typeName: string | string[], handle: Function): IComponentBinding {
    const def = this.getOrCreateDef(this.normalizeContext(typeName));
    def.handle = handle;
    return def;
  }

  addComponent(typeName: string | string[], comp: Function): IComponentBinding {
    const def = this.getOrCreateDef(this.normalizeContext(typeName));
    def.component = comp;
    return def;
  }

  normalizeContext(typeName: string | string[]): string {
    if (isArray(typeName)) {
      typeName = typeName.map(x => snakeCase(x)).join('.');
    } else {
      typeName = snakeCase(typeName);
    }
    return typeName;
  }

  createHandle<T>(typeName: string): T {
    const handler = this.getOrCreateDef(this.normalizeContext(typeName));
    if (!handler || !handler.handle) {
      throw new NoFormHandlerDefinedForTypeError(typeName);
    }
    if (isString(handler.handle) || isRegExp(handler.handle)) {
      throw new Error('pattern');
    }
    const obj = Reflect.construct(handler.handle, []);
    obj.type = typeName;
    return obj;
  }

  createComponent<T>(typeName: string): T {
    const handler = this.getOrCreateDef(this.normalizeContext(typeName));
    if (!handler || !handler.component) {
      throw new NoFormHandlerDefinedForTypeError(typeName);
    }
    const obj = Reflect.construct(handler.component, []);
    obj.type = typeName;
    return obj;
  }

  getComponentClass(context: string | string[]): any {
    context = this.normalizeContext(context);
    const found = this.handler.find(x => x.key === context);
    if (found) {
      return found.component;
    }
    return null;
  }

  setComponentClass(name: string | string[], fn: Function, extra: IBindingInfo = null): IComponentBinding {
    const binding = this.addComponent(name, fn);
    if (binding) {
      if (extra) {
        binding.extra = merge(binding.extra, extra);
      }
      this.sort();
      return binding;
    }
    return null;
  }

  filter(f: (x: IComponentBinding) => boolean): IComponentBinding[] {
    return this.handler.filter(f);
  }

  find(f: (x: IComponentBinding) => boolean): IComponentBinding {
    return this.handler.find(f);
  }


  forHandle(handle: Function | string) {
    const lookup = isString(handle) ? handle : handle.name;
    return this.handler.filter(x =>
      x.handle && (
        (
          isFunction(x.handle) && x.handle.name === lookup
        )
        || (
          isString(x.handle) && (new RegExp(x.handle)).test(lookup)
        ) ||
        (
          isRegExp(x.handle) && x.handle.test(lookup)
        )
      )
    );

  }

  getOrCreateDef(typeName: string | string[], normalize: boolean = false): IComponentBinding {
    const _typeName = normalize || isArray(typeName) ? this.normalizeContext(typeName) : typeName;
    let exists: IComponentBinding = this.handler.find(x => x.key === _typeName);
    if (!exists) {
      const tags = [];
      if (isArray(typeName)) {
        tags.push(...typeName);
      } else if (isString(typeName)) {
        tags.push(...typeName.split('.'));
      }
      exists = {
        key: _typeName,
        extra: {
          tags: tags,
          weight: 0
        }
      };
      this.handler.push(exists);
    }
    return exists;
  }

  sort() {
    this.handler = orderBy(this.handler, x => get(x, 'extra.weight', 0));
  }


  getDef(typeName: string | string[], normalize: boolean = false): IComponentBinding {
    typeName = normalize || isArray(typeName) ? this.normalizeContext(typeName) : typeName;
    return this.handler.find(x => x.key === typeName);
  }


  /**
   *
   *
   * @param comp
   * @param handle
   * @param extra
   */
  setComponentForClass(comp: Function, handle: Function | RegExp | string, extra: IBindingInfo = null): IComponentBinding {
    let className = null;
    if (isFunction(handle)) {
      className = snakeCase(ComponentRegistry.getClassName(handle));
    } else if (isRegExp(handle)) {
      className = handle.source;
    } else {
      className = '' + handle;
    }
    const context = extra && extra.context ? extra.context : C_DEFAULT;
    const lookupKey = [className, context].map(x => snakeCase(x)).join('.');
    const binding = this.getOrCreateDef(lookupKey, false);
    binding.component = comp;
    binding.handle = handle;
    if (extra) {
      binding.extra = merge(binding.extra, extra);
    }
    this.sort();
    return binding;
  }

  remove(filter: (x: IComponentBinding) => boolean) {
    remove(this.handler, filter);
    this.sort();
  }

}

