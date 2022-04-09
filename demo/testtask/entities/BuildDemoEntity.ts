import { Label } from '@typexs/forms';
import { Entity, Namespace, Property, Schema } from '@allgemein/schema-api';
import { NAMESPACE_BUILT_ENTITY } from '@typexs/entity';
import { C_DEFAULT } from '@allgemein/base';

@Namespace(NAMESPACE_BUILT_ENTITY)
@Schema({ name: C_DEFAULT })
@Entity()
export class BuildDemoEntity {

  @Property({ identifier: true })
  someId: string;

  @Label()
  @Property()
  name: string;

  @Property()
  text: string;

  @Property()
  start: number;

  @Property()
  stop: number;


}
