import { Grid } from '@typexs/forms';
import { Places } from './Places';
import { Property } from '../../../../src/libs/decorators/Property';
import { Entity } from '../../../../src/libs/decorators/Entity';


@Entity({ storable: false })
export class GroupDemoObject {

  @Grid()
  @Property({ type: Places, cardinality: 0 })
  places: Places[];

}

