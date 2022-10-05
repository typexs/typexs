import { AbstractRef, AbstractRegistry, IEntityRef, METATYPE_ENTITY, RegistryFactory } from '@allgemein/schema-api';
import { C_SEARCH_INDEX } from './../Constants';
import { IndexEntityRef } from './IndexEntityRef';
import { NotYetImplementedError } from '@typexs/base';
import { ClassUtils } from '@allgemein/base';
import { IIndexEntityRefOptions } from '../IIndexEntityRefOptions';
import { snakeCase } from 'lodash';

export class IndexEntityRegistry extends AbstractRegistry {

  // eslint-disable-next-line no-use-before-define
  private static $self: IndexEntityRegistry;

  // lookupRegistry: LookupRegistry;


  static $() {
    if (!this.$self) {
      this.$self = RegistryFactory.get(C_SEARCH_INDEX) as IndexEntityRegistry;
    }
    return this.$self;
  }

  //
  // static reset() {
  //   const self = this.$().reset();
  //   this.$self = null;
  //   LookupRegistry.reset(C_INDEX);
  // }
  // //
  // // reset() {
  // //   this.lookupRegistry = null;
  // // }

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
      return this.getLookupRegistry().add(METATYPE_ENTITY, ref);
    } else {
      throw new NotYetImplementedError();
    }
  }


  private _find(instance: any): IndexEntityRef {
    const cName = ClassUtils.getClassName(instance);
    return this.getEntityRefByName(cName);
  }


  getEntityRefByName(name: string): IndexEntityRef {
    return this.getLookupRegistry().find(METATYPE_ENTITY,
      (e: IndexEntityRef) =>
        snakeCase(e.getEntityRef().name) === snakeCase(name) ||
        e.storingName === snakeCase(name) ||
        e.machineName === snakeCase(name)
    );
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


}
