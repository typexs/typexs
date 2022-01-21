import { Entity, Namespace, Property, Schema } from '@allgemein/schema-api';
import { NAMESPACE_BUILT_ENTITY } from '@typexs/entity';
@Namespace(NAMESPACE_BUILT_ENTITY)
@Schema({ name: 'default' })
@Entity()
export class EntityWithElasticTypes {

  @Property({ auto: true })
  id: number;

  @Property()
  str: string;

  @Property()
  date: Date;

  @Property({ type: 'datetime' })
  dateWithTime: Date;

  @Property()
  defaultNumber: number;

  @Property({ type: 'int' })
  int: number;

  @Property({ type: 'bigint' })
  bigint: number;

  @Property({ type: 'double' })
  double: number;

  @Property({ type: 'float' })
  float: number;

  @Property()
  bool: boolean;

}

