// to integrate the elements
import { FormComponent } from './form.component';
import { InputComponent } from './input.component';
import { CheckboxComponent } from './checkbox.component';
import { RadioComponent } from './radio.component';
import { SelectComponent } from './component/select/select.component';
import { GridComponent } from './grid/grid.component';
import { GridRowComponent } from './grid/grid-row.component';
import { GridCellComponent } from './grid/grid-cell.component';
import { LabelComponent } from './label.component';
import { FORM_ELEMENTS } from '@typexs/forms';

FORM_ELEMENTS;


export const FORM_COMPONENTS = [
  FormComponent,
  InputComponent,
  LabelComponent,
  CheckboxComponent,
  RadioComponent,
  SelectComponent,
  GridComponent,
  GridRowComponent,
  GridCellComponent
];

