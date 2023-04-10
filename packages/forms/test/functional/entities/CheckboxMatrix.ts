import { CheckboxMatrixRow } from './CheckboxMatrixRow';
import { Grid } from '../../../src/decorators/Grid';
import { Entity, Property } from '@allgemein/schema-api';

@Entity({ storable: false })
export class CheckboxMatrix {

  @Grid({ fixed: true, nr: false })
  @Property({ type: CheckboxMatrixRow, cardinality: 0 })
  rows: CheckboxMatrixRow[];

}
