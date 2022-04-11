import { capitalize, defaults, get, isArray, isFunction, isNull, isString, keys, remove } from 'lodash';
import { NotYetImplementedError } from '@allgemein/base';
import { AbstractRef, ClassRef, IEntityRef, IPropertyRef, METATYPE_ENTITY, METATYPE_PROPERTY } from '@allgemein/schema-api';
import { FormObject } from './FormObject';
import { Form } from '../elements';
import { ResolveDataValue } from './ResolveDataValue';
import { ComponentRegistry } from '@typexs/base/libs/bindings/ComponentRegistry';
import { LabelHelper } from '@typexs/base/libs/utils/LabelHelper';
import { NoFormTypeDefinedError } from './exceptions/NoFormTypeDefinedError';
import { IFormOptions } from './IFormOptions';
import { Log } from '@typexs/base-ng';
import { K_CHECKBOX, K_FORM, K_GRID, K_HIDDEN, K_NAME, K_READONLY, K_SELECT, K_TEXT, K_VIRTUAL } from './Constants';

export class FormBuilder {

  private options: IFormOptions;

  private data: any;

  private form: FormObject;

  private registry: ComponentRegistry;

  constructor(registry: ComponentRegistry, options?: IFormOptions) {
    this.registry = registry;
    this.options = defaults(options || {}, <IFormOptions>{
      onlyDecoratedFields: true,
      defaultFormType: K_TEXT,
      readonlyIdentifier: true
    });
  }


  buildFromJSON(data: any): Form {
    this.data = data;
    return <Form>this._buildForm(data);
  }


  buildFromEntity(entity: IEntityRef): Form {
    this.data = entity;
    return <Form>this._buildFormObject(entity);
  }


  private _buildFormObject(entity: IEntityRef | IPropertyRef, parent: FormObject = null, options: { level: number } = { level: 0 }) {
    let formObject: FormObject = null;

    if (!this.form) {
      // this.schema = EntityRegistry.getSchema(entity.object.getSchema());
      this.form = formObject = this.registry.createHandle(K_FORM);
      formObject.handle(K_NAME, entity.id());
      formObject.handle('binding', entity);
    } else if ((<AbstractRef><any>entity).metaType === METATYPE_PROPERTY) {
      // TODO support also other types
      const property: IPropertyRef = <IPropertyRef>entity;

      const formType = this.formTypeFromProperty(property);
      if (isNull(formType)) {
        return null;
      }
      const methodName = 'for' + capitalize(formType);
      if (this[methodName]) {
        formObject = this[methodName](formType, property);
      } else {
        formObject = this.forDefault(formType, property);
      }
    } else if ((<AbstractRef><any>entity).metaType === METATYPE_ENTITY) {
      // TODO is this necessary
    }

    if (formObject != null) {
      formObject.setParent(parent);
    } else {
      // if formObject no created but parent is passed then use it as formobject further (grid <- add furter elements)
      formObject = parent;
    }

    const nextLevel = options.level + 1;
    if ((<AbstractRef><any>entity).metaType === METATYPE_ENTITY) {
      if (options.level === 0 || formObject.isStruct()) {
        const properties = (<IEntityRef>entity).getPropertyRefs().filter(x => !x.getOptions(K_VIRTUAL, false));
        for (const property of properties) {
          const childObject = this._buildFormObject(property, formObject, { level: nextLevel });
          if (childObject) {
            formObject.insert(childObject);
          }
        }
      }
    } else if ((<AbstractRef><any>entity).metaType === METATYPE_PROPERTY) {
      // TODO for properties which points to Entity / Entities
      // property.getEntityRef
      // formObject;
      const property = <IPropertyRef>entity;
      if (property.isReference()) {
        if (property.getTargetRef().hasEntityRef()) {
          // build for new entity
          const entity = (<ClassRef>property.getTargetRef()).getEntityRef();
          this._buildFormObject(entity, formObject, { level: nextLevel });
        } else {
          // insert property form elements
          const properties = property.getTargetRef().getPropertyRefs().filter(x => !x.getOptions(K_VIRTUAL, false));
          for (const property of properties) {
            const childObject = this._buildFormObject(property, formObject, { level: nextLevel });
            if (childObject) {
              formObject.insert(childObject);
            }
          }
        }
      }
    }
    formObject.postProcess();
    return formObject;
  }


  private formTypeFromProperty(property: IPropertyRef) {
    let formType = property.getOptions(K_FORM); // || 'text';
    if (!formType) {
      if (this.options.onlyDecoratedFields) {
        // no form declared skip then
        return null;
      }
      // form type is not set, try detect
      // TODO Defaults for the field
      if (property.isIdentifier() && get(this.options, 'readonlyIdentifier', true)) {
        formType = K_READONLY;
      } else if (property.isReference()) {
        if (property.getTargetRef().hasEntityRef()) {
          formType = K_SELECT;
        } else {
          formType = K_GRID;
        }
      } else {
        let datatype = property.getType();
        if (isFunction(datatype)) {
          try {
            datatype = datatype();
          } catch (e) {
            Log.error(e);
          }
        }
        if (isString(datatype)) {
          switch (datatype) {
            case 'number':
            case 'string':
            case 'date':
              formType = K_TEXT;
              break;
            case 'boolean':
              formType = K_CHECKBOX;
              break;
            default:
              formType = get(this.options, 'defaultFormType', K_HIDDEN);
              break;
          }
        }
      }
      // property.setOption(K_FORM, formType);
    }
    return formType;
  }

  private forDefault(formType: string, property: IPropertyRef) {
    const formObject: FormObject = this.registry.createHandle(formType);
    if (formObject) {
      formObject.handle('variant', formType);
      this._applyValues(formObject, property);
      return formObject;
    }
    throw new NoFormTypeDefinedError(formType);
  }


  private forText(formType: string, property: IPropertyRef) {
    return this._forInput(formType, property);
  }


  private forPassword(formType: string, property: IPropertyRef) {
    return this._forInput(formType, property);
  }


  private forHidden(formType: string, property: IPropertyRef) {
    return this._forInput(formType, property);
  }


  private forReadonly(formType: string, property: IPropertyRef) {
    const input = this._forInput(K_TEXT, property);
    input.handle(K_READONLY, true);
    return input;
  }


  private forEmail(formType: string, property: IPropertyRef) {
    return this._forInput(formType, property);
  }

  private _forInput(formType: string, property: IPropertyRef) {
    const formObject: FormObject = this.registry.createHandle('input');
    formObject.handle('variant', formType);
    this._applyValues(formObject, property);
    return formObject;
  }


  private _applyValues(formObject: FormObject, property: IPropertyRef) {
    formObject.handle(K_NAME, property.name);
    formObject.handle('id', property.id());
    formObject.handle('label', LabelHelper.labelForProperty(property));
    formObject.handle('binding', property);

    const options = property.getOptions();
    if (options) {
      keys(options).forEach(opt => {
        if (/^(source|target|property|name)/.test(opt)) {
          return;
        }
        const value = options[opt];
        formObject.handle(opt, value);
      });
    }
  }


  private _buildForm(data: any, parent: FormObject = null) {
    const keys = remove(Object.keys(data), (e: string) => ['children', 'type'].indexOf(e) === -1);

    let formObject: FormObject = null;
    if (data.type) {
      // lookup handle
      formObject = this.registry.createHandle(data.type);
    } else {
      throw new NoFormTypeDefinedError();
    }

    if (!this.form) {
      this.form = formObject;
    }

    formObject.setParent(parent);

    for (const key of keys) {
      let value = data[key];
      if (isString(value)) {
        if (/^\$/.test(value)) {
          value = new ResolveDataValue(value, formObject, key);
        }
      }
      formObject.handle(key, value);
    }


    if (data.children) {
      const value = data.children;
      if (isArray(value)) {
        for (const entry of value) {
          const childObject = this._buildForm(entry, formObject);
          formObject.insert(childObject);
        }
      } else {
        throw new NotYetImplementedError();
      }
    }

    formObject.postProcess();
    return formObject;

  }
}
