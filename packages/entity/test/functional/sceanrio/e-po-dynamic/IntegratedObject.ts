import { Embeddable, Namespace, Property, Schema } from '@allgemein/schema-api';
import { NAMESPACE_BUILT_ENTITY } from '../../../../src/libs/Constants';

@Namespace(NAMESPACE_BUILT_ENTITY)
@Schema({ name: 'e-po-dynamic' })
export class IntegratedObject {

  @Property()
  value: string;
}
