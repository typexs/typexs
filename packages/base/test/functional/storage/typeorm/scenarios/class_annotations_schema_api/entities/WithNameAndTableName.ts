import { Entity, Namespace, Property } from '@allgemein/schema-api';
import { REGISTRY_TYPEORM } from '../../../../../../../src/libs/storage/framework/typeorm/Constants';

/**
 * Using schema api
 */
@Namespace(REGISTRY_TYPEORM)
@Entity({ name: 'with_name_extra', internalName: 'with_extra_special_table_name' })
export class WithNameAndTableName {

  @Property({ identifier: true, generated: true })
  id: number;

}
