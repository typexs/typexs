import { Entity, Property } from '@allgemein/schema-api';


@Entity()
export class SchemaApiSimpleEntity {

  @Property({ identifier: true, generated: true })
  id: number;

  @Property()
  string: string;

  @Property()
  nr: number;

  @Property()
  bool: boolean;

  @Property()
  date: Date;

}
