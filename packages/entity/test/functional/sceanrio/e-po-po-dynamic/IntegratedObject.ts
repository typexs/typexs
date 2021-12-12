import { Namespace, Property, Schema } from '@allgemein/schema-api';
import { NAMESPACE_BUILT_ENTITY } from '../../../../src/libs/Constants';
import { SecondIntegratedObject } from './SecondIntegratedObject';

@Namespace(NAMESPACE_BUILT_ENTITY)
@Schema({ name: 'e-po-po-dynamic' })
export class IntegratedObject {

  @Property()
  value: string;

  @Property({ type: SecondIntegratedObject })
  second: SecondIntegratedObject;
}
