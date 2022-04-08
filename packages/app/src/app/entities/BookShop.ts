import { Book } from './Book';
import { Property } from '@typexs/entity/libs/decorators/Property';
import { Entity } from '@typexs/entity/libs/decorators/Entity';
import { Readonly, Select } from '@typexs/forms';
import { EntityOptionsService } from '@typexs/entity-ng';


@Entity()
export class BookShop {

  @Readonly()
  @Property({ type: 'number', auto: true })
  id: number;

  @Property({ type: 'string' })
  shopName: string;

  @Select({ enum: EntityOptionsService.name })
  @Property({ type: Book, cardinality: 0 })
  private books: Book[];

}
