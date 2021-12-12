import { Entity, Namespace, Property, Schema } from '@allgemein/schema-api';
import { NAMESPACE_BUILT_ENTITY } from '@typexs/entity';

@Namespace(NAMESPACE_BUILT_ENTITY)
@Schema({ name: 'default' })
@Entity()
export class EntityBySchemaApi {

  @Property({ id: true })
  id: number;

  @Property()
  name: string;

}
