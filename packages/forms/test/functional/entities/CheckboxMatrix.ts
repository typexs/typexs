import { Entity, K_STORABLE, Property } from '@typexs/entity';
import { CheckboxMatrixRow } from './CheckboxMatrixRow';
import { Grid } from '../../../src/decorators/Grid';


@Entity({ [K_STORABLE]: false })
export class CheckboxMatrix {

  @Grid({ fixed: true, nr: false })
  @Property({ type: CheckboxMatrixRow, cardinality: 0 })
  rows: CheckboxMatrixRow[];

}
