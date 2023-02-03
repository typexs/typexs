import { Entity, ISchemaOptions, Property } from '@allgemein/schema-api';
import { Hidden, Text } from '@typexs/forms';

@Entity()
export class StoredSchema {

  @Hidden()
  @Property({ id: true, auto: true })
  id: number;

  @Text()
  @Property()
  name: string;

  @Property({ type: Object })
  options: ISchemaOptions = { name: null };


  @Hidden()
  @Property({ type: 'date:created' })
  createdAt: Date;

  @Hidden()
  @Property({ type: 'date:updated' })
  updatedAt: Date;
}

