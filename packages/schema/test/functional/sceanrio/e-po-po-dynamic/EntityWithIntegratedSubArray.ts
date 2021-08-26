import { Entity, Namespace, Property, Schema } from '@allgemein/schema-api';
import { NAMESPACE_BUILT_ENTITY } from '../../../../src/libs/Constants';
import { IntegratedObject } from './IntegratedObject';
import { IntegratedObjectArray } from './IntegratedObjectArray';

@Namespace(NAMESPACE_BUILT_ENTITY)
@Schema({ name: 'e-po-po-dynamic' })
@Entity()
export class EntityWithIntegrated {

  @Property({ identifier: true, generated: true })
  id: number;

  @Property()
  nr: number;

  @Property({ type: IntegratedObjectArray, cardinality: 0 })
  object: IntegratedObjectArray;

}
