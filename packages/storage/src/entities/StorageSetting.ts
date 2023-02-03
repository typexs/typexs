import { Entity, Property } from '@allgemein/schema-api';
import { Hidden, Text } from '@typexs/forms';
import { IStorageRefOptions } from '@typexs/base';

@Entity()
export class StorageSetting {

  @Hidden()
  @Property({ id: true, auto: true })
  id: number;

  @Text()
  @Property()
  framework: string;

  @Text()
  @Property()
  name: string;

  @Text()
  @Property({ type: Object })
  options: IStorageRefOptions = {};




  @Hidden()
  @Property({ type: 'date:created' })
  createdAt: Date;

  @Hidden()
  @Property({ type: 'date:updated' })
  updatedAt: Date;
}

