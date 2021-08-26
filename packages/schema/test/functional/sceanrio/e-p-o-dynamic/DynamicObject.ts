import { Embeddable, Namespace, Property, Schema } from '@allgemein/schema-api';
import { NAMESPACE_BUILT_ENTITY } from '../../../../src/libs/Constants';

@Namespace(NAMESPACE_BUILT_ENTITY)
@Schema({ name: 'e-p-o-dynamic' })
@Embeddable()
export class DynamicObject {

  @Property({ identifier: true, generated: true })
  id: number;

  @Property()
  value: string;
}
