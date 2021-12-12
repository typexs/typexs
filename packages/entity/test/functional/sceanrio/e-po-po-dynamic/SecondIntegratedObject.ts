import { Embeddable, Namespace, Property, Schema } from '@allgemein/schema-api';
import { NAMESPACE_BUILT_ENTITY } from '../../../../src/libs/Constants';

@Namespace(NAMESPACE_BUILT_ENTITY)
@Schema({ name: 'e-po-po-dynamic' })
export class SecondIntegratedObject {

  @Property()
  value: string;
}
