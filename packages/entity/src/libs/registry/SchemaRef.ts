// import {XS_TYPE_BINDING_SCHEMA_CLASS_REF, METATYPE_PROPERTY} from './../Constants';
import { EntityRef } from './EntityRef';
import { ISchema } from './ISchema';
import { PropertyRef } from './PropertyRef';
import {
  IClassRef,
  ILookupRegistry,
  METADATA_TYPE,
  METATYPE_PROPERTY,
  METATYPE_SCHEMA,
  RegistryFactory,
  SchemaRef as _SchemaRef
} from '@allgemein/schema-api';
import { assign } from 'lodash';


export class SchemaRef extends _SchemaRef {


  constructor(options: ISchema = { name: 'default' }) {
    super(assign(options, { metaType: METATYPE_SCHEMA }));
  }


  id() {
    return this.name.toLowerCase();
  }


  getStorableEntities(): EntityRef[] {
    return this.getEntityRefs().filter((x: EntityRef) => x.isStorable()) as EntityRef[];
  }


  // eslint-disable-next-line @typescript-eslint/ban-types
  getPropertiesFor(fn: Function): PropertyRef[] {
    return this.getRegistry().filter(METATYPE_PROPERTY, (p: PropertyRef) => p.getClassRef().getClass() === fn);
  }


  getRegistry(): ILookupRegistry {
    return RegistryFactory.get(this.namespace);
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  getClassRefFor(
    object: string | Function | IClassRef,
    type: METADATA_TYPE
  ): IClassRef {
    return this.getRegistry().getClassRefFor(object, type);
  }


}
