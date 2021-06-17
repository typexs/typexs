import {clone, get, isEmpty, isFunction, isNull, upperFirst} from 'lodash';
import {Component, ComponentFactoryResolver, Inject, Injector, Input, OnInit} from '@angular/core';
import {AbstractComponent} from '../AbstractComponent';
import {C_DEFAULT} from '../../constants';
import {ComponentRegistryService} from '../component-registry.service';
import {ComponentRegistry, IComponentBinding} from '@typexs/ng';

@Component({
  selector: 'txs-view',
  templateUrl: 'view-data.component.html',
  styleUrls: ['./view-data.component.scss']
})
export class ViewDataComponent<T> extends AbstractComponent<T> implements OnInit {

  private _build = false;

  inputKeys = ['options'];

  private _mode: string = C_DEFAULT;

  viewModes: IComponentBinding[] = null;

  @Input()
  allowViewModeSwitch: boolean = false;

  @Input()
  options: any;

  @Input()
  set mode(mode: string) {
    this.setViewContext(mode);
  }

  get mode() {
    return this.getViewContext();
  }


  @Input()
  set instance(value: any) {
    this.setInstance(value);
    this._build = false;
    this.__build();
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
    this.__build();
  }

  private __build() {
    if (!this._build && this.instance) {
      // TODO check permissions for this!
      if (this.allowViewModeSwitch) {
        const className = ComponentRegistry.getClassName(this.instance);
        this.viewModes = this.componentRegistry.registry
          .forHandle(className)
          .filter(x => get(x, 'extra.context', false)
          );
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
    const context = this['getViewContext'] ? this['getViewContext']() : C_DEFAULT;
    const obj = this.getComponentRegistry().getComponentForObject(content, context);
    if (obj && obj.component) {
      if (!isNull(this.viewModes) && isFunction(obj.component['supportedViewModes'])) {
        const viewModes: string[] = obj.component['supportedViewModes'].call(null);
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

