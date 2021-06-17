import {capitalize, filter} from 'lodash';
import {IPropertyRef, METATYPE_PROPERTY} from '@allgemein/schema-api';
import {ResolveDataValue} from './ResolveDataValue';
import {TreeObject} from '../views/TreeObject';



export function isFormObject(obj: TreeObject | FormObject): obj is FormObject {
  return obj instanceof FormObject;
}

export abstract class FormObject extends TreeObject {

  id: string;

  usedKeys: string[] = [];

  name: string;

  label: string;

  help: string;

  // to mark element as read only
  private readonly: boolean = false;

  private selectable: boolean = false;

  private multiple: boolean = false;

  private struct: boolean = false;

  private limited: number = -1;

  protected replicable: boolean = false;

  private binding: IPropertyRef = null;

  // getGivenLabel() {
  //   return this.binding.label();
  // }

  isSelection() {
    return this.selectable;
  }

  isEntityReference() {
    return this.binding.isReference() && this.binding.getTargetRef().hasEntityRef();
  }


  isStruct() {
    return this.struct;
  }

  isReadonly() {
    return this.readonly;
  }

  isMultiple() {
    return this.multiple;
  }

  isReplicable() {
    return this.replicable;
  }

  getBinding() {
    return this.binding;
  }

  getUsedKeys() {
    return this.usedKeys;
  }

  getPath(): string {
    const arr = [];

    if (this.getBinding().metaType === METATYPE_PROPERTY) {
      if (this.getParent()) {
        const parent = this.getParent();
        if (isFormObject(parent)) {
          arr.push(parent.getPath());
        } else {
          //  throw new Error('parent is not a form object');
        }
      }
      arr.push(this.name);
      if (this.getBinding().isCollection()) {
        arr.push('$idx');
      }
    }
    return filter(arr, (x: string) => x.trim() !== '').join('.');
  }


  getForm(): FormObject {
    if (this.parent && isFormObject(this.parent)) {
      return this.parent.getForm();
    } else if (this.type === 'form') {
      return this;
    } else {
      // TODO throw error this should never happen
      return null;
    }
  }

  handle(key: string, value: any) {
    if (value instanceof ResolveDataValue) {
      const form = this.getForm(); //
      form['resolver'].push(value);
    }
    this.usedKeys.push(key);
    const methodName = 'handle' + capitalize(key);
    if (this[methodName]) {
      this[methodName](value);
    } else {
      this[key] = value;
    }
  }

  /**
   * Don't override type
   */
  private handleType(value: string) {
  }


  postProcess() {
  }


  replace(someObject: FormObject) {
    const parent = this.getParent();
    const idx = parent.getChildren().indexOf(this);
    if (idx < 0) {
      throw new Error('can not find index, something is wrong');
    }
    parent.getChildren()[idx] = someObject;
    someObject.setParent(parent);
    return someObject;
  }

  getEnum() {
    return this.getBinding().getOptions(<any>'enum');
  }

  protected handleEnum(value: any) {
    this.handle('selectable', true);
  }

  protected handleCardinality(value: number) {
    if (value === 0 || value > 1) {
      this.handle('multiple', true);
      if (value > 1) {
        this.handle('limited', value);
      }
    }

  }

}
