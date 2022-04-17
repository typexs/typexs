import { Schema, Entity, Property, Namespace } from '@allgemein/schema-api';
import { REGISTRY_TYPEORM } from '../../../../../src';

@Namespace(REGISTRY_TYPEORM)
@Entity({ name: 'passing_other_name' })
export class EntityPassName {

  @Property({ type: 'number', auto: true })
  id: number;

  @Property({ type: 'string' })
  value: string;


}

