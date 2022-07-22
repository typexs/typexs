import { Schema, Entity, Property, Namespace } from '@allgemein/schema-api';
import { REGISTRY_TYPEORM } from '../../../../../src/libs/storage/framework/typeorm/Constants';

@Namespace(REGISTRY_TYPEORM)
@Entity({ name: 'passing_other_name', typeorm: { schema: 'test' } })
export class EntityWithDbSchema {

  @Property({ type: 'number', auto: true })
  id: number;

  @Property({ type: 'string' })
  value: string;


}

