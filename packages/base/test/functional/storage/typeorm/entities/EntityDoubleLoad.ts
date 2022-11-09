import { Schema, Entity, Property, Namespace } from '@allgemein/schema-api';
import { REGISTRY_TYPEORM } from '../../../../../src/libs/storage/framework/typeorm/Constants';

/**
 * Pass name which should be the table name in the underlaying db source
 *
 * EntityName:  passing_other_name
 * ClassName: EntityPassInternalName
 * DB Name: passing_other_name
 */
@Namespace(REGISTRY_TYPEORM)
@Entity({ name: 'passing_double_load' })
export class EntityDoubleLoad {

  @Property({ type: 'number', auto: true })
  id: number;

  @Property({ type: 'string' })
  value: string;


}

