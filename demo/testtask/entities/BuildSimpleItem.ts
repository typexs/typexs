import { Label } from '@typexs/ng';
import { Entity, Namespace, Property, Schema } from '@allgemein/schema-api';
import { NAMESPACE_BUILT_ENTITY } from '@typexs/entity';
import { C_DEFAULT } from '@allgemein/base';
import { InnerValue } from './InnerValue';

@Namespace(NAMESPACE_BUILT_ENTITY)
@Schema({ name: C_DEFAULT })
@Entity()
export class BuildSimpleItem {

  @Property({ auto: true })
  id: number;

  @Label()
  @Property()
  name: string;

  @Property()
  text: string;

  @Property()
  start: number;

  @Property()
  stop: number;

  @Property()
  inner: InnerValue;

}
