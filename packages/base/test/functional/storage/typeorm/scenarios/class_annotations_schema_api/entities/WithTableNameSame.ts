import { Entity, Namespace, Property } from '@allgemein/schema-api';
import { REGISTRY_TYPEORM } from '../../../../../../../src/libs/storage/framework/typeorm/Constants';

/**
 * Using schema api
 */
@Namespace(REGISTRY_TYPEORM)
@Entity({internalName: 'with_special_table_name'})
export class WithTableNameSame {

  @Property({ identifier: true, generated: true })
  id: number;

}
