import { Entity, Property } from '@allgemein/schema-api';
import { Hidden, Text } from '@typexs/forms';
import { IStorageRefOptions } from '@typexs/base';
import { isEmpty, isNumber, isString } from 'lodash';

@Entity()
export class StorageSetting {

  @Hidden()
  @Property({ identifier: true, generated: true })
  id: number;

  @Text()
  @Property()
  framework: string;

  @Text()
  @Property()
  type: string;

  @Text()
  @Property()
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


  getId() {
    return [this.name, this.id].join('_');
  }

  static resolveId(idName: string) {
    if (!idName) {
      throw new Error('value is empty');
    }
    if (!isString(idName)) {
      throw new Error('value is not a string');
    }
    const [name, id] = idName.split(/_(?=\d+$)/, 2);
    if (isEmpty(name) || !id || !/\d+/.test(id)) {
      throw new Error('id is not present in the name');
    }
    return { name: name, id: parseInt(id, 10) };
  }
}

