import { Embeddable, Namespace, Property, Schema } from '@allgemein/schema-api';
import { NAMESPACE_BUILT_ENTITY } from '@typexs/entity';
import { C_DEFAULT } from '@allgemein/base';

@Namespace(NAMESPACE_BUILT_ENTITY)
@Schema({ name: C_DEFAULT })
@Embeddable()
export class InnerValue {

  @Property()
  name: string;

  @Property()
  text: string;


}
