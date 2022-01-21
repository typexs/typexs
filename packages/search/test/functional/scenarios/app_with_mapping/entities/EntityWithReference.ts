import { Entity, Namespace, Property, Schema } from '@allgemein/schema-api';
import { NAMESPACE_BUILT_ENTITY } from '@typexs/entity';
import { EntityWithElasticTypes } from './EntityWithElasticTypes';

@Namespace(NAMESPACE_BUILT_ENTITY)
@Schema({ name: 'default' })
@Entity()
export class EntityWithReference {

  @Property({ auto: true })
  id: number;

  @Property()
  str: string;

  @Property()
  date: Date;

  @Property({type: EntityWithElasticTypes})
  ref: EntityWithElasticTypes;

}

