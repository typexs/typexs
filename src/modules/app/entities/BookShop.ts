import {Book} from './Book';
import {Property} from '@typexs/schema/libs/decorators/Property';
import {Entity} from '@typexs/schema/libs/decorators/Entity';
import {Select} from '@typexs/ng';
import {Readonly} from '@typexs/ng';
import {EntityOptionsService} from '@typexs/entity-ng';


@Entity()
export class BookShop {

  @Readonly()
  @Property({type: 'number', auto: true})
  id: number;

  @Property({type: 'string'})
  shopName: string;

  @Select({enum: EntityOptionsService.name})
  @Property({type: Book, cardinality: 0})
  private books: Book[];

}
