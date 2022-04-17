import { Schema, Entity, Property, Namespace } from '@allgemein/schema-api';
import { NAMESPACE_BUILT_ENTITY } from '../../../../src';

@Namespace(NAMESPACE_BUILT_ENTITY)
@Schema({ name: 'registry' })
@Entity({ name: 'passing_other_name' })
export class EntityPassName {

  @Property({ type: 'number', auto: true })
  id: number;

  @Property({ type: 'string' })
  value: string;


}

