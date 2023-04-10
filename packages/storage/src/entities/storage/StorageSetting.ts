import { Entity, Property } from '@allgemein/schema-api';
import { Hidden, Text } from '@typexs/forms';
import { IStorageRefOptions } from '@typexs/base';

@Entity()
export class StorageSetting {

  @Hidden()
  @Property({ identifier: true, generated: true })
  id: number;

  /**
   * Name of the framework used
   */
  @Text()
  @Property()
  framework: string;

  @Text()
  @Property()
  type: string;

  @Text()
  @Property({ unique: true })
  name: string;


  @Property({ type: 'string', nullable: true })
  mode: 'db' | 'config' = 'db';


  @Property()
  active: boolean;

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

