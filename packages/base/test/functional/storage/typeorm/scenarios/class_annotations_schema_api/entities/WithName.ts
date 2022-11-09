import { Entity, Namespace, Property } from '@allgemein/schema-api';
import { REGISTRY_TYPEORM } from '../../../../../../../src/libs/storage/framework/typeorm/Constants';

/**
 * Using schema api
 */
@Namespace(REGISTRY_TYPEORM)
@Entity({name: 'with_special_name'})
export class WithName {

  @Property({ identifier: true, generated: true })
  id: number;

}
