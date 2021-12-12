import { Driver } from './Driver';
import { Entity, Namespace, Property, Schema } from '@allgemein/schema-api';
import { NAMESPACE_BUILT_ENTITY } from '@typexs/entity';

@Namespace(NAMESPACE_BUILT_ENTITY)
@Schema({ name: 'default' })
@Entity()
export class Car {

  @Property({ type: 'number', auto: true })
  id: number;

  @Property({ type: 'string' })
  producer: string;

  @Property({ type: Driver, nullable: true })
  driver: Driver;

}

