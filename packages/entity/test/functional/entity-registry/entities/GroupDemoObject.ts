
import {Entity} from '@typexs/entity/libs/decorators/Entity';
import {Property} from '@typexs/entity/libs/decorators/Property';
import {Grid} from '@typexs/ng';
import {Places} from './Places';


@Entity({storable: false})
export class GroupDemoObject {

  @Grid()
  @Property({type: Places, cardinality: 0})
  places: Places[];

}

