import { Entity, Property } from '@allgemein/schema-api';
import { Label } from '../../../src/decorators/Label';
import { Checkbox } from '../../../src/decorators/Checkbox';
import { ISelectOption } from '../../../src/elements/ISelectOption';


@Entity({ 'storable': false })
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
