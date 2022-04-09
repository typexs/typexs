import { Entity } from '@typexs/entity/libs/decorators/Entity';
import { Property } from '@typexs/entity/libs/decorators/Property';
import { Grid } from '@typexs/forms';
import { Places } from './Places';


@Entity({ storable: false })
export class GridFieldObject {

  @Grid()
  @Property({ type: Places, cardinality: 0 })
  places: Places[];

}

