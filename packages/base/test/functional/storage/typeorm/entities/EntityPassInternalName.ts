import { Schema, Entity, Property, Namespace } from '@allgemein/schema-api';
import { REGISTRY_TYPEORM } from '../../../../../src/libs/storage/framework/typeorm/Constants';

/**
 * Pass internalName with should be the table name in the underlaying db source
 *
 * EntityName:  EntityPassInternalName
 * ClassName: EntityPassInternalName
 * DB Name: passing_other_internal_name
 */
@Namespace(REGISTRY_TYPEORM)
@Entity({ internalName: 'passing_other_internal_name' })
export class EntityPassInternalName {

  @Property({ type: 'number', auto: true })
  id: number;

  @Property({ type: 'string' })
  value: string;


}

