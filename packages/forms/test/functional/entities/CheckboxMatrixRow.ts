import { Entity } from '@typexs/entity/libs/decorators/Entity';
import { Property } from '@typexs/entity/libs/decorators/Property';
import { K_STORABLE } from '@typexs/entity/libs/Constants';
import { Label } from '../../../src/decorators/Label';
import { Checkbox } from '../../../src/decorators/Checkbox';
import { ISelectOption } from '../../../src/elements/ISelectOption';


@Entity({ [K_STORABLE]: false })
export class CheckboxMatrixRow {

  @Label()
  @Property()
  label: string;

  @Checkbox({ enum: 'rolesValues' })
  @Property({ type: 'string', cardinality: 0 })
  roles: string[];

  @Property({ virtual: true })
  rolesValues: ISelectOption[] = [
    { value: 'admin', label: 'Admin' },
    { value: 'user', label: 'User' }
  ];

}
