import { get, isArray, set } from 'lodash';
import { ClassRef, DataContainer, METATYPE_PROPERTY } from '@allgemein/schema-api';
import { Expressions } from '@allgemein/expressions';
import { Context, FormObject, isFormObject, NoFormTypeDefinedError } from '@typexs/ng';
import { Component, ComponentFactoryResolver, Inject, Injector } from '@angular/core';
import { AbstractComponent, UrlHelper } from '@typexs/base-ng';
import { K_READONLY } from '../constants';

@Component({
  template: ''
})
export class AbstractFormComponent<T extends FormObject> extends AbstractComponent<T> {

  static _inc = 0;


  data: DataContainer<any>;

  inc = 0;

  private _defaultValue: any = null;

  _value: any = null;

  constructor(
    @Inject(Injector) public injector: Injector,
    @Inject(ComponentFactoryResolver) public r: ComponentFactoryResolver) {
    super(injector, r);
    this.construct();
  }


  construct() {
    this.inc = AbstractFormComponent._inc++;
  }

  get id() {
    return this.getInstance()?.id;
  }


  get name() {
    return this.getInstance()?.name;
  }


  get label() {
    return this.getInstance()?.label;
  }


  get labelDisplay() {
    return this.context.get('labelDisplay', 'top');
  }


  get help() {
    return this.getInstance()?.help;
  }


  get isReadOnly() {
    return this.getInstance()?.isReadonly() ? K_READONLY : null;
  }


  get isValid() {
    return this.data.checked(this.name) && this.data.valid(this.name);
  }

  get defaultValue() {
    return this._defaultValue;
  }

  setDefaultValue(v: any) {
    this._defaultValue = v;
  }


  protected setFormObject(elem: T) {
    this.setInstance(elem);
  }


  setData(elem: T, parent: Context, idx: number = -1) {
    this.setFormObject(elem);
    if (parent) {
      this.context = parent.child(elem.name, idx);
    } else {
      this.context = new Context();
      if (elem.getBinding().metaType === METATYPE_PROPERTY) {
        this.context.name = elem.name;
        this.context.idx = idx;
      }
    }
  }

  getValue() {
    const path = this.context.path();
    return get(this.data.instance, path, null);
  }

  setValue(v: any) {
    const path = this.context.path();
    return set(this.data.instance, path, v);
  }

  get value() {
    if (this._value) {
      return this._value;
    } else {
      this._value = this.getValue();
      if (this._value) {
        const binding = this.getInstance().getBinding();
        if (binding.isReference() && binding.getTargetRef().hasEntityRef()) {
          if (isArray(this._value)) {
            this._value = this._value.map(v =>
              UrlHelper.buildLookupConditions((<ClassRef>binding.getTargetRef()).getEntityRef(), v) + '');
          } else {
            const cond = UrlHelper.buildLookupConditions((<ClassRef>binding.getTargetRef()).getEntityRef(), this._value);
            this._value = [cond];
          }
        } else if (binding.isCollection()) {
          if (this._value) {
            if (!isArray(this._value)) {
              this._value = [this._value];
            }
          }
        }
      }
    }
    return this._value;
  }


  set value(v: any) {
    this._value = v;
    const binding = this.getInstance().getBinding();
    if (binding.isReference() && binding.getTargetRef().hasEntityRef()) {
      let data = [];
      if (isArray(v)) {
        data = v;
      } else {
        data = [v];
      }
      let refs = data.map(v => Expressions.parseLookupConditions(((<ClassRef>binding.getTargetRef()).getEntityRef()), v));
      if (!binding.isCollection()) {
        refs = refs.shift();
      }
      this.setValue(refs);
    } else {
      if (binding.isCollection()) {
        if (isArray(v)) {
          this.setValue(v);
        } else {
          this.setValue([v]);
        }
      } else {
        if (isArray(v) && v.length === 1) {
          this.setValue(v[0]);
        } else {
          this.setValue(v);
        }
      }

    }
  }


  build(form: FormObject): AbstractComponent<T>[] {
    const comp: AbstractComponent<T>[] = [];
    for (const formObject of form.getChildren()) {
      // console.log(formObject);
      if (isFormObject(formObject)) {
        const handle = this.getComponentRegistry().getOrCreateDef(formObject.type);
        if (handle && handle.component) {
          if (this.vc) {
            const ref = this.createComponentView(<any>handle.component);
            const instance = <AbstractFormComponent<any>>ref.instance;
            instance.data = this.data;
            instance.setData(formObject, this.context);
            instance.build(formObject);
            comp.push(instance);
          } else {
            // console.error('No view content setted');
          }
        } else {
          throw new NoFormTypeDefinedError(formObject.type);
        }
      }
    }
    return comp;
  }

}
