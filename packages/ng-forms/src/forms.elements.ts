// to integrate the elements
import {FORM_ELEMENTS} from '@typexs/ng';
import {FormComponent} from './form.component';
import {InputComponent} from './input.component';
import {CheckboxComponent} from './checkbox.component';
import {RadioComponent} from './radio.component';
import {SelectComponent} from './select/select.component';
import {GridComponent} from './grid/grid.component';
import {GridRowComponent} from './grid/grid-row.component';
import {GridCellComponent} from './grid/grid-cell.component';
import {LabelComponent} from './label.component';

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

