import { PropertyRef } from './PropertyRef';
import { IEntity } from './IEntity';
import { assign, defaults, isArray } from 'lodash';


import {
  DefaultEntityRef,
  IClassRef,
  IEntityRef,
  IJsonSchemaSerializeOptions,
  ILookupRegistry,
  JsonSchema,
  METADATA_TYPE,
  METATYPE_ENTITY,
  METATYPE_PROPERTY,
  RegistryFactory
} from '@allgemein/schema-api';
import { ClassUtils } from '@allgemein/base';
import { K_STORABLE, NAMESPACE_BUILT_ENTITY } from '../Constants';
import { Expressions } from '@allgemein/expressions';
import { __CLASS__, LabelHelper } from '@typexs/base';

const DEFAULT_OPTIONS: IEntity = {
  storable: true
};

const REGEX_ID = /(([\w_]+)=((\d+)|(\d+(\.|\,)\d+)|\'([^\']*)\'),?)/;
const REGEX_ID_G = /(([\w_]+)=((\d+)|(\d+(\.|\,)\d+)|\'([^\']*)\'),?)/g;

const REGEX_ID_K = /((\d+)|(\d+(\.|\,)\d+)|\'([^\']*)\',?)/;
const REGEX_ID_KG = /((\d+)|(\d+(\.|\,)\d+)|\'([^\']*)\',?)/g;

export class EntityRef extends DefaultEntityRef {


  constructor(options: IEntity = {}) {
    super(defaults(assign(options, { metaType: METATYPE_ENTITY }), DEFAULT_OPTIONS));
    // super(METATYPE_ENTITY, fn instanceof ClassRef ? fn.className : fn.name, fn, NAMESPACE_BUILT_ENTITY);
    // OptionsHelper.merge(this.object, options);

    // options = _.defaults(options, DEFAULT_OPTIONS);
    // this.setOptions(options);
  }


  static resolve(instance: any, namespace: string = NAMESPACE_BUILT_ENTITY) {
    return RegistryFactory.get(namespace).getEntityRefFor(instance);
  }


  // not implemented yet
  areRevisionsEnabled() {
    return false;
  }

  isStorable() {
    return this.getOptions(K_STORABLE, true);
  }


  getPropertyRefs(): PropertyRef[] {
    return this.getRegistry().getPropertyRefs(this as IEntityRef) as PropertyRef[];
  }

  getPropertyRef(name: string): PropertyRef {
    return this.getPropertyRefs().find(p => p.name === name) as PropertyRef;
  }

  /**
   * get properties which contain identifier
   *
   * @returns {any[]}
   */
  getPropertyRefIdentifier(): PropertyRef[] {
    return this.getRegistry().filter(METATYPE_PROPERTY, (e: PropertyRef) =>
      e.getSourceRef().getClass() === this.getClass() && e.isIdentifier());
    // return LookupRegistry.$().filter(METATYPE_PROPERTY, (e: PropertyDef) => e.entityName === this.name && e.identifier);
  }

  id() {
    return this.getClassRef().id();
  }

  isOf(instance: any): boolean {
    const name = ClassUtils.getClassName(instance);
    if (name && name === this.name) {
      return true;
    } else if (instance[__CLASS__] && instance[__CLASS__] === this.name) {
      return true;
    }
    return false;
  }

  resolveId(instance: any) {
    const id: any = {};
    const propIds = this.getPropertyRefIdentifier();
    for (const prop of propIds) {
      id[prop.name] = prop.get(instance);
    }
    return id;
  }

  resolveIds(instance: any | any[]) {
    if (isArray(instance)) {
      return instance.map(i => this.resolveId(i));
    }
    return this.resolveId(instance);
  }

  buildLookupConditions(data: any | any[]) {
    return Expressions.buildLookupConditions(this, data);
  }


  createLookupConditions(id: string): any | any[] {
    return Expressions.parseLookupConditions(this, id);
  }


  label(entity: any, sep: string = ' ', max: number = 1024): string {
    return LabelHelper.labelForEntity(entity, this, sep, max);
  }


  getKeyMap() {
    const map = {};
    this.getPropertyRefs().map(p => {
      !p.isReference() ? map[p.name] = p.storingName : null;
    });
    return map;
  }


  toJsonSchema(options: IJsonSchemaSerializeOptions = {}) {
    options = options || {};
    return JsonSchema.serialize(this, {
      ...options,
      namespace: this.namespace,
      allowKeyOverride: true,
      deleteReferenceKeys: false
    });
  }


  getRegistry(): ILookupRegistry {
    return RegistryFactory.get(this.namespace);
  }

  getClassRefFor(object: string | Function | IClassRef, type: METADATA_TYPE): IClassRef {
    return this.getRegistry().getClassRefFor(object, type);
  }
}
