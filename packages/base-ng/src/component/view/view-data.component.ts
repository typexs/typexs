import { clone, get, isEmpty, isFunction, isNull, isString, upperFirst } from 'lodash';
import { Component, ComponentFactoryResolver, Inject, Injector, Input, OnInit } from '@angular/core';
import { AbstractInstancableComponent } from '../abstract-instancable.component';
import { C_DEFAULT, MTHD_getViewContext, STATIC_VAR_supportedViewModes } from '../../constants';
import { ComponentRegistryService } from '../component-registry.service';
import { ComponentRegistry, IComponentBinding } from '@typexs/base';
import { IViewOptions } from './IViewOptions';

@Component({
  selector: 'txs-view',
  templateUrl: 'view-data.component.html',
  styleUrls: ['./view-data.component.scss']
})
export class ViewDataComponent<T> extends AbstractInstancableComponent<T> implements OnInit {

  private _build = false;

  private _init = false;

  inputKeys = ['options'];

  private _mode: string = C_DEFAULT;

  viewModes: IComponentBinding[] = null;

  @Input()
  allowViewModeSwitch: boolean = false;

  @Input()
  options: IViewOptions = {};

  /**
   * Passthrough input parameter to build componentn instance
   */
  @Input()
  passThrough: { [propName: string]: any } = {};

  @Input()
  set mode(mode: string) {
    this.setViewContext(mode);
  }

  get mode() {
    return this.getViewContext();
  }

  /**
   * Override method getPassthrough
   */
  getPassthrough(): {} {
    return this.passThrough;
  }


  @Input()
  set instance(value: any) {
    this.setInstance(value);
    this._build = false;
    if (this._init) {
      this.__build();
    }
  }

  get instance(): any {
    return this.getInstance();
  }


  constructor(
    @Inject(Injector) public injector: Injector,
    @Inject(ComponentFactoryResolver) public r: ComponentFactoryResolver,
    private componentRegistry: ComponentRegistryService) {
    super(injector, r);
  }

  getViewContext(): string {
    return this._mode;
  }

  setViewContext(context: string) {
    this._mode = context;
  }

  switchLayout(viewMode: IComponentBinding) {
    this.reset();
    this.mode = viewMode.extra.context;
    return this.buildComponent(viewMode.component as any, this.instance);
  }

  ngOnInit() {
    this._init = true;
    this.__build();
  }

  isAllowViewModeSwitch() {
    return get(this.options, 'allowViewModeSwitch', this.allowViewModeSwitch);
  }

  private __build() {
    if (!this._build && this.instance) {
      // TODO check permissions for this!
      if (this.isAllowViewModeSwitch()) {
        this.viewModes = this.componentRegistry.registry.forInstance(this.instance)
          .filter(x => {
            if (x.extra) {
              const context = isString(x.extra.context) && !isEmpty(x.extra.context);
              return context && !x.extra.hide;
            }
            return false;
          });
      }
      this.reset();
      this.buildSelf(this.instance);
      this._build = true;
    }
  }

  addViewMode(obj: IComponentBinding, viewMode: string) {
    if (!isEmpty(this.viewModes)) {
      // add view mode dynamically if not present
      const exists = this.viewModes.find(x => x.extra.context === viewMode);
      if (!exists) {
        const append: IComponentBinding = {
          key: '',
          component: obj.component,
          handle: obj.handle,
          extra: clone(get(obj, 'extra', {}))
        };
        append.extra.context = viewMode;
        append.extra.label = upperFirst(viewMode);
        this.viewModes.unshift(append);
      }
    }
  }

  buildComponentForObject(content: any) {
    const context = this[MTHD_getViewContext] ? this[MTHD_getViewContext]() : C_DEFAULT;
    const obj = this.getComponentRegistry().getComponentForObject(content, context);
    if (obj && obj.component) {
      if (!isNull(this.viewModes) && isFunction((obj.component as any)[STATIC_VAR_supportedViewModes])) {
        // check if static method supportedViewModes is present
        const viewModes: string[] = (obj.component as any)[STATIC_VAR_supportedViewModes].call(null);
        if (!isEmpty(viewModes)) {
          viewModes.forEach(x => {
            this.addViewMode(obj, x);
          });
        }
      }
      this.addViewMode(obj, context);
      return this.buildComponent(obj.component as any, content);
    }
    return null;
  }

}

