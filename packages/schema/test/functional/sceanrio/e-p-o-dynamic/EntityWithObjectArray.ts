import { Entity, Namespace, Property, Schema } from '@allgemein/schema-api';
import { NAMESPACE_BUILT_ENTITY } from '../../../../src/libs/Constants';
import { DynamicObject } from './DynamicObject';

@Namespace(NAMESPACE_BUILT_ENTITY)
@Schema({name: 'e-p-o-dynamic'})
@Entity()
export class EntityWithObjectArray {

  @Property({ identifier: true, generated: true })
  id: number;

  @Property()
  nr: number;

  @Property({ type: DynamicObject, cardinality: 0})
  object: DynamicObject[];

}


