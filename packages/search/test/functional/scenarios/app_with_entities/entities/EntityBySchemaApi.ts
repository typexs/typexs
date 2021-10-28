import { Entity, Property } from '@allgemein/schema-api';

@Entity()
export class EntityBySchemaApi {

  @Property({ id: true })
  id: number;

  @Property()
  name: string;

}
