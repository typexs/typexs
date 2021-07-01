import {AbstractRef, IEntityRef, ILookupRegistry, IPropertyRef, LookupRegistry} from '@allgemein/schema-api';
import {C_INDEX} from './../Constants';
import {IndexEntityRef} from './IndexEntityRef';
import {XS_TYPE_ENTITY} from 'commons-schema-api/browser';
import {NotYetImplementedError} from '@typexs/base';
import {ClassUtils} from '@allgemein/base';
import * as _ from 'lodash';
import {IIndexEntityRefOptions} from '../IIndexEntityRefOptions';

export class IndexEntityRegistry implements ILookupRegistry {

  private static $self: IndexEntityRegistry;

  lookupRegistry: LookupRegistry;

  constructor() {
    this.lookupRegistry = LookupRegistry.$(C_INDEX);
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
  create(referenceRef: IEntityRef, indexName: string, options?: IIndexEntityRefOptions) {
    const ref = new IndexEntityRef(referenceRef, indexName, options);
    this.register(ref);
    return ref;
  }


  register(ref: AbstractRef) {
    if (ref instanceof IndexEntityRef) {
      return this.lookupRegistry.add(XS_TYPE_ENTITY, ref);
    } else {
      throw new NotYetImplementedError();
    }

  }

  fromJson(json: any): IEntityRef {
    return undefined;
  }

  private find(instance: any): IndexEntityRef {
    const cName = ClassUtils.getClassName(instance);
    return this.getEntityRefByName(cName);
  }


  getEntityRefByName(name: string): IndexEntityRef {
    return this.lookupRegistry.find(XS_TYPE_ENTITY, (e: IndexEntityRef) => {
      return e.entityRef.machineName === _.snakeCase(name) || e.machineName === _.snakeCase(name);
    });
  }


  getEntityRefFor(instance: any): IndexEntityRef {
    if (!instance) {
      return null;
    }
    const entityRef = this.find(instance);
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
