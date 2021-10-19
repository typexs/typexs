import {
  AbstractRef,
  IClassRef,
  IEntityRef,
  ILookupRegistry,
  IPropertyRef,
  ISchemaRef,
  LookupRegistry,
  METADATA_TYPE,
  METATYPE_ENTITY
} from '@allgemein/schema-api';
import { C_INDEX } from './../Constants';
import { IndexEntityRef } from './IndexEntityRef';
import { NotYetImplementedError } from '@typexs/base';
import { ClassUtils } from '@allgemein/base';
import * as _ from 'lodash';
import { IIndexEntityRefOptions } from '../IIndexEntityRefOptions';

export class IndexEntityRegistry implements ILookupRegistry {

  private static $self: IndexEntityRegistry;

  lookupRegistry: LookupRegistry;

  constructor() {
    this.lookupRegistry = LookupRegistry.$(C_INDEX);
  }

  getSchemaRefs<T extends ISchemaRef>(filter?: (x: ISchemaRef) => boolean): (T | ISchemaRef)[] {
    throw new Error('Method not implemented.');
  }

  getSchemaRefsFor(fn: any) {
    throw new Error('Method not implemented.');
  }

  getEntityRefs<T extends IEntityRef>(filter?: (x: IEntityRef) => boolean): (IEntityRef | T)[] {
    throw new Error('Method not implemented.');
  }

  getPropertyRef<T extends IPropertyRef>(ref: IEntityRef | IClassRef, name: string): T | IPropertyRef {
    throw new Error('Method not implemented.');
  }

  getPropertyRefs<T extends IPropertyRef>(ref: IEntityRef | IClassRef): (IPropertyRef | T)[] {
    throw new Error('Method not implemented.');
  }

  getLookupRegistry(): LookupRegistry {
    throw new Error('Method not implemented.');
  }

  getClassRefFor(object: string | Function | IClassRef, type: METADATA_TYPE): IClassRef {
    throw new Error('Method not implemented.');
  }

  create<T>(context: string, options: any): T {
    throw new Error('Method not implemented.');
  }

  add<T>(context: string, entry: T): T {
    throw new Error('Method not implemented.');
  }

  remove<T>(context: string, search: any): T[] {
    throw new Error('Method not implemented.');
  }

  filter<T>(context: string, search: any): T[] {
    throw new Error('Method not implemented.');
  }

  find<T>(context: string, search: any): T {
    throw new Error('Method not implemented.');
  }

  static $() {
    if (!this.$self) {
      this.$self = new IndexEntityRegistry();
    }
    return this.$self;
  }

  static reset() {
    const self = this.$().reset();
    this.$self = null;
    LookupRegistry.reset(C_INDEX);
  }

  reset() {
    this.lookupRegistry = null;
  }

  /**
   * Create new reference entry from given one
   * @param referenceRef
   */
  _create(referenceRef: IEntityRef, indexName: string, options?: IIndexEntityRefOptions) {
    const ref = new IndexEntityRef(referenceRef, indexName, options);
    this.register(ref);
    return ref;
  }


  register(ref: AbstractRef) {
    if (ref instanceof IndexEntityRef) {
      return this.lookupRegistry.add(METATYPE_ENTITY, ref);
    } else {
      throw new NotYetImplementedError();
    }

  }

  fromJson(json: any): IEntityRef {
    return undefined;
  }

  private _find(instance: any): IndexEntityRef {
    const cName = ClassUtils.getClassName(instance);
    return this.getEntityRefByName(cName);
  }


  getEntityRefByName(name: string): IndexEntityRef {
    return this.lookupRegistry.find(METATYPE_ENTITY,
      (e: IndexEntityRef) => e.entityRef.machineName === _.snakeCase(name) || e.machineName === _.snakeCase(name));
  }


  getEntityRefFor(instance: any): IndexEntityRef {
    if (!instance) {
      return null;
    }
    const entityRef = this._find(instance);
    if (entityRef) {
      return entityRef;
    }
    return null;
  }


  getPropertyRefsFor(fn: any): IPropertyRef[] {
    return [];
  }

  list<X>(type: any, filter?: (x: any) => boolean): X[] {
    return [];
  }

  listEntities(filter?: (x: IEntityRef) => boolean): IEntityRef[] {
    return [];
  }

  listProperties(filter?: (x: IPropertyRef) => boolean): IPropertyRef[] {
    return [];
  }
}
